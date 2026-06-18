import type { Review } from "@/types";

export const reviews: Review[] = [
  {
    id: "1",
    author: "Michelle N.",
    rating: 5,
    text: "Pensa num look bafônico. Apaixonada! Obrigada, Virtuosa.",
    verified: true,
    date: "2026-06-17",
  },
  {
    id: "2",
    author: "Jordany F.",
    rating: 5,
    text: "Aquele delivery que a gente ama, com muita delicadeza e capricho. Amei o bilhetinho.",
    verified: true,
    date: "2026-06-17",
  },
  {
    id: "3",
    author: "Camila F.",
    rating: 5,
    text: "Ela é tão caprichosa e as peças são de altíssima qualidade.",
    verified: true,
    date: "2026-06-17",
  },
];

export const aggregateRating = {
  score: 5.0,
  total: 3,
};
