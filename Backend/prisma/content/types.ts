/** Shape of an editorial article prepared for population. Sources are embedded
 * in the content HTML as a "Sources" section (visible on the article page). */
export interface SeedArticle {
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  seoDescription: string;
  content: string;
}
