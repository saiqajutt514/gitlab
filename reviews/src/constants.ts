export enum ReviewExternalType {
  Rider = 1,
  Captain = 2,
}

export const CREATE_REVIEW = 'create-review';

export const GET_REVIEWS = 'get-reviews';

export const GET_REVIEWS_BY_EXTERNAL = 'get-reviews-by-external_id';

export const UPDATE_REVIEW = 'update-review';

export const DELETE_REVIEW = 'delete-review';

export const GET_META_REVIEWS = 'get-meta-reviews';

export const GET_META_REVIEW_BY_EXTERNAL = 'get-meta-review-by-external';

export const GET_RATING_COUNTS_BY_EXTERNAL = 'get-rating-counts-by-external';

export const DASHBOARD_REVIEW_STATS = 'dashboard-review-stats';
