/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} discordId
 * @property {string} username
 * @property {string} displayName
 * @property {string} avatarUrl
 * @property {string} createdAt
 * @property {boolean} discordLinked
 */

/**
 * @typedef {Object} AccountProfile
 * @property {string} userId
 * @property {string} rsiHandle
 * @property {"not_linked" | "pending" | "verified"} rsiStatus
 * @property {string} rsiVerificationCode
 * @property {string} rsiVerifiedAt
 * @property {string} rsiVerificationMethod
 * @property {string} publicName
 * @property {number} rating
 * @property {number} completedContracts
 * @property {number} activeListings
 * @property {string} orgAffiliation
 */

/**
 * @typedef {Object} ShipListingModel
 * @property {string} id
 * @property {string} ownerId
 * @property {string} shipId
 * @property {string[]} availableDates
 */

/**
 * @typedef {Object} CrewListingModel
 * @property {string} id
 * @property {string} ownerId
 * @property {string} role
 * @property {number} pricePerHour
 */

/**
 * @typedef {Object} MaterialRequestModel
 * @property {string} id
 * @property {string} requesterId
 * @property {string} material
 * @property {number} quantityScu
 */

/**
 * @typedef {Object} MaterialOfferModel
 * @property {string} id
 * @property {string} materialRequestId
 * @property {string} providerId
 * @property {number} offeredQuantityScu
 */

/**
 * @typedef {Object} DealModel
 * @property {string} id
 * @property {string} requesterUserId
 * @property {string} providerUserId
 * @property {string} listingId
 * @property {"ship_rental" | "crew_service" | "material_order" | "contract" | "general"} dealType
 * @property {"pending" | "accepted" | "rejected" | "cancelled" | "in_progress" | "completion_requested" | "completed" | "disputed"} status
 * @property {boolean} requesterConfirmedComplete
 * @property {boolean} providerConfirmedComplete
 * @property {string} requesterConfirmedAt
 * @property {string} providerConfirmedAt
 * @property {string} completedAt
 */

/**
 * @typedef {Object} RatingModel
 * @property {string} id
 * @property {string} reviewerId
 * @property {string} revieweeId
 * @property {number} rating
 */

/**
 * @typedef {Object} DealRatingModel
 * @property {string} id
 * @property {string} dealId
 * @property {string} reviewerUserId
 * @property {string} reviewedUserId
 * @property {number} rating
 * @property {string} comment
 */

/**
 * @typedef {Object} OrgMembershipModel
 * @property {string} id
 * @property {string} userId
 * @property {string} orgId
 * @property {string} role
 */

export {};
