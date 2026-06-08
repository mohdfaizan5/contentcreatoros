// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"7-high-performing-Twitter-X-hook-templates-tailored-for-company-accounts.mdx": () => import("../content/docs/7-high-performing-Twitter-X-hook-templates-tailored-for-company-accounts.mdx?collection=docs"), "bad-copywriting-vs-good-copywriting.mdx": () => import("../content/docs/bad-copywriting-vs-good-copywriting.mdx?collection=docs"), "copywriting.mdx": () => import("../content/docs/copywriting.mdx?collection=docs"), "top-resources-to-follow-for-solofounders.mdx": () => import("../content/docs/top-resources-to-follow-for-solofounders.mdx?collection=docs"), }),
};
export default browserCollections;