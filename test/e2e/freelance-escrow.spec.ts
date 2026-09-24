import { createHmac } from 'node:crypto';
import { test, expect, APIRequestContext, Browser, Page } from '@playwright/test';
import { registerAccount, SeededAccount, settled, signIn } from './helpers';

/**
 * The freelance escrow and payout screens, driven through a real browser
 * against the real API on the production build.
 *
 * The unit tests pin what each screen offers each party against a mocked API,
 * and backend/test/ci pins the money rules against PostgreSQL. Only a browser
 * says whether a client can actually schedule, fund and approve a milestone on
 * the page, whether the freelancer then sees the money arrive, and whether the
 * payout it becomes reaches them.
 *
 * The API runs with the sandbox payment processor. It moves no money: a
 * milestone is funded only when a webhook signed with
 * FREELANCE_SANDBOX_WEBHOOK_SECRET says so, which is the part this spec plays -
 * the same signed notification a real processor would send.
 */

const API = () => process.env.TEST_API_URL!;

interface Hire {
  client: SeededAccount;
  freelancer: SeededAccount;
  contractID: string;
  projectTitle: string;
}

async function ok(response: Awaited<ReturnType<APIRequestContext['post']>>, expected: number) {
  expect(response.status(), await response.text()).toBe(expected);
  return response.json();
}

/** A client and an onboarded freelancer with a signed contract worth AED 1,000.00. */
async function hire(request: APIRequestContext): Promise<Hire> {
  const api = API();
  const client = await registerAccount(request, api, 'fl-client', 'Escrow', 'Client');
  const freelancer = await registerAccount(request, api, 'fl-free', 'Escrow', 'Freelancer');
  const as = (account: SeededAccount) => ({ Authorization: `Bearer ${account.token}` });

  await ok(await request.post(`${api}/api/v1/freelance/profile`, {
    headers: as(freelancer),
    data: { hourly_rate: 95, tagline: 'Backend engineer', skills: ['Go', 'PostgreSQL'] },
  }), 200);
  await ok(await request.post(`${api}/api/v1/freelance/onboarding/complete`, { headers: as(freelancer) }), 200);

  const projectTitle = `Escrow journey ${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const project = await ok(await request.post(`${api}/api/v1/freelance/projects`, {
    headers: as(client),
    data: {
      title: projectTitle,
      description: 'A project seeded by the escrow journey spec.',
      budget: 1000,
      budget_type: 'fixed',
      skills_required: ['Go'],
    },
  }), 201);
  const projectID = project.project.id as string;
  for (const status of ['published', 'accepting_proposals']) {
    await ok(await request.patch(`${api}/api/v1/freelance/my/projects/${projectID}`, {
      headers: as(client),
      data: { status },
    }), 200);
  }
  const proposal = await ok(await request.post(`${api}/api/v1/freelance/projects/${projectID}/proposals`, {
    headers: as(freelancer),
    data: { bid_amount: 1000, estimated_days: 10, cover_letter: 'Proposal from the escrow journey spec.' },
  }), 201);
  const accepted = await ok(await request.post(`${api}/api/v1/freelance/proposals/${proposal.proposal.id}/accept`, {
    headers: as(client),
  }), 201);
  return { client, freelancer, contractID: accepted.contract.id as string, projectTitle };
}

/** Plays the payment processor: a signed "the money is held" for a charge. */
async function confirmPayment(request: APIRequestContext, reference: string) {
  const secret = process.env.FREELANCE_SANDBOX_WEBHOOK_SECRET;
  expect(secret, 'the API under test needs FREELANCE_SANDBOX_WEBHOOK_SECRET').toBeTruthy();
  const body = JSON.stringify({ type: 'charge.succeeded', reference });
  const signature = createHmac('sha256', secret!).update(body).digest('hex');
  const response = await request.post(`${API()}/api/v1/freelance/payments/webhooks/sandbox`, {
    headers: { 'Content-Type': 'application/json', 'X-Kirmya-Signature': `sha256=${signature}` },
    data: body,
  });
  expect(response.status(), await response.text()).toBe(200);
}

/** Seeds a funded milestone through the API, for journeys that start later on. */
async function fundedMilestone(request: APIRequestContext, h: Hire, title: string, amount: number): Promise<string> {
  const api = API();
  const headers = { Authorization: `Bearer ${h.client.token}` };
  const m = await ok(await request.post(`${api}/api/v1/freelance/contracts/${h.contractID}/milestones`, {
    headers,
    data: { title, amount },
  }), 201);
  const funding = await ok(await request.post(`${api}/api/v1/freelance/contracts/${h.contractID}/milestones/${m.id}/fund`, {
    headers,
  }), 202);
  await confirmPayment(request, funding.payment_intent.provider_reference);
  return m.id as string;
}

async function submitThroughAPI(request: APIRequestContext, h: Hire, milestoneID: string) {
  await ok(await request.post(`${API()}/api/v1/freelance/contracts/${h.contractID}/milestones/${milestoneID}/submit`, {
    headers: { Authorization: `Bearer ${h.freelancer.token}` },
    data: { summary: 'Delivered by the escrow journey spec.', attachments: ['https://example.com/delivery'] },
  }), 200);
}

/** A page signed in as one account, in its own browser context. */
async function pageFor(browser: Browser, account: SeededAccount): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, API(), account.email);
  return page;
}

async function openContract(page: Page, h: Hire) {
  await page.goto(`/freelance/contracts/${h.contractID}`);
  await settled(page.getByRole('heading', { name: h.projectTitle }));
}

const milestoneRow = (page: Page, title: string) =>
  page.locator('[data-testid^="milestone-"]').filter({ hasText: title });

test.describe('Freelance escrow', () => {
  test('a milestone is scheduled, funded, delivered, approved and paid out to the freelancer', async ({ browser, request }) => {
    test.setTimeout(120_000);
    const h = await hire(request);

    // The client schedules the work.
    const client = await pageFor(browser, h.client);
    await openContract(client, h);
    await client.getByRole('button', { name: 'Add milestone' }).first().click();
    const add = client.getByRole('dialog');
    await add.getByLabel('Title').fill('Design and build');
    await add.getByLabel(/^Amount/).fill('600');
    await add.getByRole('button', { name: 'Add milestone' }).click();
    const row = milestoneRow(client, 'Design and build');
    await expect(row.getByText('Awaiting payment', { exact: true })).toBeVisible();

    // Funding requests the payment; it does not take it.
    const funding = client.waitForResponse(
      r => r.url().endsWith('/fund') && r.request().method() === 'POST'
    );
    await row.getByRole('button', { name: /^Fund / }).click();
    const fundResponse = await funding;
    expect(fundResponse.status()).toBe(202);
    await expect(client.getByText(/Payment requested/)).toBeVisible();
    await expect(row.getByText('Awaiting payment', { exact: true })).toBeVisible();

    // The processor confirms the money; only then is the milestone funded.
    await confirmPayment(request, (await fundResponse.json()).payment_intent.provider_reference);
    await client.reload();
    await expect(milestoneRow(client, 'Design and build').getByText('Funded', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(client.getByText('In escrow').locator('..')).toContainText('600.00');

    // The freelancer delivers.
    const freelancer = await pageFor(browser, h.freelancer);
    await openContract(freelancer, h);
    await milestoneRow(freelancer, 'Design and build').getByRole('button', { name: 'Submit work' }).click();
    const submit = freelancer.getByRole('dialog');
    await submit.getByLabel('What you delivered').fill('The designs and the build, deployed to staging.');
    await submit.getByRole('button', { name: 'Submit for review' }).click();
    await expect(milestoneRow(freelancer, 'Design and build').getByText('Awaiting review', { exact: true })).toBeVisible();
    // The freelancer is never offered the client's decision.
    await expect(freelancer.getByRole('button', { name: 'Approve and release' })).toHaveCount(0);

    // The client approves, releasing the escrowed money.
    await client.reload();
    await milestoneRow(client, 'Design and build').getByRole('button', { name: 'Approve and release' }).click();
    await expect(milestoneRow(client, 'Design and build').getByText('Paid', { exact: true })).toBeVisible();
    await expect(client.getByText('Released to freelancer').locator('..')).toContainText('600.00');

    // The freelancer is told to set up payouts, and doing so sends the money.
    await freelancer.reload();
    await freelancer.getByRole('link', { name: 'Set up payouts' }).click();
    await expect(freelancer).toHaveURL(/\/freelance\/payouts$/);
    await expect(freelancer.getByText(/Waiting to be sent: AED\s*600\.00/)).toBeVisible();
    await freelancer.getByRole('button', { name: 'Set up payouts' }).click();
    await expect(freelancer.getByText(/Payouts are set up/)).toBeVisible();

    await expect(async () => {
      await freelancer.reload();
      const history = freelancer.getByRole('table');
      await expect(history.getByText('Sent', { exact: true })).toBeVisible({ timeout: 2_000 });
      await expect(history).toContainText('600.00');
    }).toPass({ timeout: 30_000 });
    await expect(freelancer.getByText(/Waiting to be sent:/)).toHaveCount(0);

    // The client has nothing to be paid for and is told so.
    await client.goto('/freelance/payouts');
    await expect(client.getByText(/No payouts yet/)).toBeVisible();
    await client.getByRole('button', { name: 'Set up payouts' }).click();
    await expect(client.getByText(/Payouts are for freelancers/)).toBeVisible();
  });

  test('a dispute freezes the milestone, and withdrawing it puts the work back where it was', async ({ browser, request }) => {
    test.setTimeout(90_000);
    const h = await hire(request);
    const m = await fundedMilestone(request, h, 'Disputed work', 1000);
    await submitThroughAPI(request, h, m);

    const client = await pageFor(browser, h.client);
    await openContract(client, h);
    const row = milestoneRow(client, 'Disputed work');
    await expect(row.getByText('Awaiting review', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Open dispute' }).click();
    const dialog = client.getByRole('dialog');
    await dialog.getByLabel('Reason').click();
    await client.getByRole('option', { name: 'Quality of the work' }).click();
    await dialog.getByLabel('What happened').fill('The build does not match the approved designs.');
    await dialog.getByRole('button', { name: 'Open dispute' }).click();

    // Frozen: the money stays in escrow and nobody can approve it meanwhile.
    await expect(client.getByText(/in dispute\. Its money stays in escrow/)).toBeVisible();
    await expect(milestoneRow(client, 'Disputed work').getByText('In dispute', { exact: true })).toBeVisible();
    await expect(client.getByRole('button', { name: 'Approve and release' })).toHaveCount(0);

    // The freelancer sees it too.
    const freelancer = await pageFor(browser, h.freelancer);
    await openContract(freelancer, h);
    await expect(milestoneRow(freelancer, 'Disputed work').getByText('In dispute', { exact: true })).toBeVisible();

    // The client, who raised it, withdraws it; the milestone is back in review.
    await client.getByRole('link', { name: 'View dispute' }).first().click();
    await expect(client).toHaveURL(/\/freelance\/disputes\//);
    await client.getByRole('button', { name: 'Withdraw dispute' }).click();
    await openContract(client, h);
    await expect(milestoneRow(client, 'Disputed work').getByText('Awaiting review', { exact: true })).toBeVisible();
    await expect(milestoneRow(client, 'Disputed work').getByRole('button', { name: 'Approve and release' })).toBeVisible();
  });

  test('the freelancer can hand a funded milestone back to the client', async ({ browser, request }) => {
    test.setTimeout(90_000);
    const h = await hire(request);
    await fundedMilestone(request, h, 'Work that will not happen', 400);

    const freelancer = await pageFor(browser, h.freelancer);
    await openContract(freelancer, h);
    await milestoneRow(freelancer, 'Work that will not happen').getByRole('button', { name: 'Refund client' }).click();
    const dialog = freelancer.getByRole('dialog');
    await dialog.getByLabel('Why you are refunding').fill('I can no longer take this on.');
    await dialog.getByRole('button', { name: 'Refund', exact: true }).click();

    await expect(milestoneRow(freelancer, 'Work that will not happen').getByText('Cancelled', { exact: true })).toBeVisible();
    await expect(freelancer.getByText('In escrow').locator('..')).toContainText('0.00');
  });

  test('somebody outside the contract is not shown it', async ({ browser, request }) => {
    const h = await hire(request);
    const stranger = await registerAccount(request, API(), 'fl-stranger', 'Escrow', 'Stranger');

    const page = await pageFor(browser, stranger);
    await page.goto(`/freelance/contracts/${h.contractID}`);
    await expect(page.getByText(/could not be found, or you do not have access to it/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(h.projectTitle)).toHaveCount(0);
  });
});
