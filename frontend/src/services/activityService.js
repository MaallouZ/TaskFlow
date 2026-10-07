import { request } from './api.js';

export function getActivity({ from, to, source = 'all' }) {
  return request(`/stats/activity?from=${from}&to=${to}&source=${source}`);
}