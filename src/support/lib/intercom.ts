/** Build a deep link to a conversation in the Intercom inbox. */
export function intercomConversationUrl(
  workspaceId: string,
  conversationId: string,
): string {
  return `https://app.intercom.com/a/inbox/${workspaceId}/inbox/shared/all/conversation/${conversationId}`
}
