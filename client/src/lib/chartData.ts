import { z } from 'zod';

export const squareSchema = z.object({
  name: z.string(),
  size: z.number(),
  color: z.string(),
  children: z.array(z.lazy(() => squareSchema)).optional(),
  style: z.object({
    borderWidth: z.number().optional(),
    borderStyle: z.string().optional(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    textStyle: z.object({
      bold: z.boolean(),
      italic: z.boolean(),
      underline: z.boolean(),
    }).optional(),
    urgency: z.enum(['red', 'yellow', 'orange', 'green', 'black']).optional(),
  }).optional(),
});

export type Square = z.infer<typeof squareSchema>;

export const initialData: Square = {
  name: "Root Square",
  size: 100,
  color: "#ffffe0",
  children: [
    {
      name: "Branch 1",
      size: 25,
      color: "#fafac5",
      children: [
        {
          name: "Leaf 1.1",
          size: 6.25,
          color: "#f0e68c",
          children: [
            { name: "Fruit 1.1.1", size: 1.5625, color: "#fa8072" },
            { name: "Fruit 1.1.2", size: 1.5625, color: "#e9967a" },
            { name: "Fruit 1.1.3", size: 1.5625, color: "#ffa07a" }
          ]
        }
      ]
    }
  ]
};
