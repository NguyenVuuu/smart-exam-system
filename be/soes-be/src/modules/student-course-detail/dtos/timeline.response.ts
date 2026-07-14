export type TimelineItemType = "POST" | "EXAM";

export interface TimelineItemResponse {
  id: string;
  type: TimelineItemType;
  title: string;
  publishedAt: Date;
  edited?: boolean;

  startTime?: Date;
  endTime?: Date;
}
