export const CREATE_REVIEW = "create-review"
export const CREATE_TRIP_REVIEW = 'create-trip-review'
export const UPDATE_REVIEW = 'update-review'
export const DELETE_REVIEW = 'delete-review'
export const CAN_REVIEW = 'can-review'
export const GET_REVIEWS_BY_EXTERNAL = 'get-reviews-by-external_id'

export const tripRequestPatterns = [
    CAN_REVIEW,
    CREATE_TRIP_REVIEW
];
export const reviewRequestPattern = [
    CREATE_REVIEW,
    GET_REVIEWS_BY_EXTERNAL,
    UPDATE_REVIEW,
    DELETE_REVIEW
]