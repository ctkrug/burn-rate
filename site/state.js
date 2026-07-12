// Encodes/decodes the ticker's state to and from URL query params, which is
// what makes a running counter shareable: paste the URL, the receiver's tab
// resumes the same live count from the same start time.

/**
 * @param {{headcount: number, salary: number, startedAt: number}} state
 * @returns {string} a query string (no leading "?") encoding the state.
 */
export function encodeState(state) {
  const params = new URLSearchParams();
  params.set("headcount", String(state.headcount));
  params.set("salary", String(state.salary));
  params.set("startedAt", String(state.startedAt));
  return params.toString();
}

/**
 * @param {URLSearchParams | string} search
 * @returns {{headcount: number, salary: number, startedAt: number} | null}
 *   null if the params don't describe a valid running counter.
 */
export function decodeState(search) {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search);

  const headcount = Number(params.get("headcount"));
  const salary = Number(params.get("salary"));
  const startedAt = Number(params.get("startedAt"));

  if (
    !Number.isInteger(headcount) ||
    !Number.isFinite(salary) ||
    !Number.isFinite(startedAt) ||
    headcount <= 0 ||
    salary <= 0 ||
    startedAt <= 0
  ) {
    return null;
  }

  return { headcount, salary, startedAt };
}

/** Presenter mode travels in the URL as `present=1` so it survives a reload. */
export function isPresenter(search) {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return params.get("present") === "1";
}

/**
 * Build the shareable query string: the running state plus an optional
 * presenter flag. Returned without a leading "?".
 * @param {{headcount: number, salary: number, startedAt: number}} state
 * @param {boolean} [presenter]
 */
export function buildShareQuery(state, presenter = false) {
  const query = encodeState(state);
  return presenter ? `${query}&present=1` : query;
}
