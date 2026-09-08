import axios from 'axios';
import { API_BASE_URL } from '../../shared/api_base';

/**
 * The footer subscription form's transport.
 *
 * F09. The form used to set a local flag and render "Subscribed successfully!"
 * without making a request, so every address it collected was discarded at the
 * moment the visitor was told it had been kept. These calls are what makes the
 * message true.
 */
export const newsletterApi = {
  /** Stores an address. Rejects if the server could not save it. */
  async subscribe(email: string, source = 'footer'): Promise<{ message: string }> {
    const { data } = await axios.post(`${API_BASE_URL}/newsletter/subscribe`, { email, source });
    return data;
  },

  /** Removes an address, by the opaque token from an unsubscribe link. */
  async unsubscribe(token: string): Promise<{ message: string }> {
    const { data } = await axios.post(`${API_BASE_URL}/newsletter/unsubscribe`, { token });
    return data;
  },
};
