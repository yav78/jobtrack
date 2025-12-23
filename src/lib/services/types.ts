import type { z } from "zod";
import type { opportunityActionCreateSchema, opportunityActionUpdateSchema } from "@/lib/validators/opportunity-action";

export type OpportunityActionCreateInput = z.infer<typeof opportunityActionCreateSchema>;
export type OpportunityActionUpdateInput = z.infer<typeof opportunityActionUpdateSchema>;

