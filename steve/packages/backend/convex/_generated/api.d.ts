/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authUtils from "../authUtils.js";
import type * as backfillMedia from "../backfillMedia.js";
import type * as chatAssistant from "../chatAssistant.js";
import type * as chatAssistantNode from "../chatAssistantNode.js";
import type * as chatConversationHelpers from "../chatConversationHelpers.js";
import type * as chatConversationUnreadCount from "../chatConversationUnreadCount.js";
import type * as chatConversations from "../chatConversations.js";
import type * as chatMediaContract from "../chatMediaContract.js";
import type * as chatMediaHelpers from "../chatMediaHelpers.js";
import type * as chatMessages from "../chatMessages.js";
import type * as chatProfiles from "../chatProfiles.js";
import type * as chatProfilesStorage from "../chatProfilesStorage.js";
import type * as chatReadState from "../chatReadState.js";
import type * as chatStevePayloads from "../chatStevePayloads.js";
import type * as invitationCodes from "../invitationCodes.js";
import type * as messageImageLifecycle from "../messageImageLifecycle.js";
import type * as messageSemantics from "../messageSemantics.js";
import type * as r2Media from "../r2Media.js";
import type * as steveInterventionPolicy from "../steveInterventionPolicy.js";
import type * as systemPrompts from "../systemPrompts.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authUtils: typeof authUtils;
  backfillMedia: typeof backfillMedia;
  chatAssistant: typeof chatAssistant;
  chatAssistantNode: typeof chatAssistantNode;
  chatConversationHelpers: typeof chatConversationHelpers;
  chatConversationUnreadCount: typeof chatConversationUnreadCount;
  chatConversations: typeof chatConversations;
  chatMediaContract: typeof chatMediaContract;
  chatMediaHelpers: typeof chatMediaHelpers;
  chatMessages: typeof chatMessages;
  chatProfiles: typeof chatProfiles;
  chatProfilesStorage: typeof chatProfilesStorage;
  chatReadState: typeof chatReadState;
  chatStevePayloads: typeof chatStevePayloads;
  invitationCodes: typeof invitationCodes;
  messageImageLifecycle: typeof messageImageLifecycle;
  messageSemantics: typeof messageSemantics;
  r2Media: typeof r2Media;
  steveInterventionPolicy: typeof steveInterventionPolicy;
  systemPrompts: typeof systemPrompts;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
