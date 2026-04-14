import { ContentBundle } from "../types/app";
import { availableStacks, generatedContentMeta, generatedIssues } from "../data/generatedIssues";

export { availableStacks, generatedContentMeta, generatedIssues };

export const localContentBundle: ContentBundle = {
  issues: generatedIssues,
  availableStacks,
  contentMeta: generatedContentMeta,
};
