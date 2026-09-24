/**
 * What to tell a person when a freelance request is refused.
 *
 * The server answers every refusal with a status and, where two refusals must
 * be told apart, a machine-readable code. This turns those into a sentence;
 * it never invents a reason the server did not give.
 */
export function freelanceErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { status?: number; data?: { error?: string; code?: string; field?: string } } })
    ?.response;
  const code = response?.data?.code;
  switch (code) {
    case 'FREELANCE_PAYMENTS_UNAVAILABLE':
      return 'Payments are not available yet, so this milestone cannot be funded right now.';
    case 'FREELANCE_PAYMENT_PROVIDER_ERROR':
      return 'The payment processor could not complete this. Nothing was charged or moved - please try again.';
    case 'FREELANCE_ESCROW_CONFLICT':
    case 'FREELANCE_ILLEGAL_TRANSITION':
      return 'This changed since you loaded the page. Refresh to see where it stands now.';
    case 'FREELANCE_VALIDATION_FAILED':
      return response?.data?.error?.replace(/^freelance: /, 'Please check: ') ?? fallback;
  }
  switch (response?.status) {
    case 403:
      return 'You do not have permission to do that on this contract.';
    case 404:
      return 'This could not be found, or you do not have access to it.';
  }
  return fallback;
}
