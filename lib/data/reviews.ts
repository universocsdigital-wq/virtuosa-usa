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
  {
    id: "4",
    author: "Ximene M.",
    rating: 5,
    text: "Sem problemas, todas as peças são lindas e maravilhosas. Amei tudo. Deus abençoe.",
    verified: true,
    date: "2026-06-19",
  },
  {
    id: "5",
    author: "Silvana S.",
    rating: 5,
    text: "Chegou meu vestido rosa e estou encantada com ele. O tecido é perfeito e os bordados são um sonho.",
    verified: true,
    date: "2026-06-19",
  },
  {
    id: "6",
    author: "Geovana O.",
    rating: 5,
    text: "Passando para agradecer pelas maravilhosas roupas. Que perfeição de material e de atendimento.",
    verified: true,
    date: "2026-06-19",
  },
];

export const aggregateRating = {
  score: 5.0,
  total: 6,
};
