
export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Task {
  time_slot: string;
  task_detail: string;
  category: string;
  status: string;
  note?: string;
  recurrence?: RecurrenceType;
  recurrenceId?: string;
}

export interface NewTaskData {
  task_detail: string;
  time_slot: string;
  category: string;
  note?: string;
  recurrence: RecurrenceType | 'none';
}

export interface EditableTaskData {
  task_detail: string;
  time_slot: string;
  category: string;
}

export interface Day {
  day: string;
  focus: string;
  tasks: Task[];
}

export interface PlannerData {
  week_title: string;
  week_period: string;
  days: Day[];
}

export interface PlannerCollection {
  [monthAndYear: string]: PlannerData[];
}

export interface ParsedTask {
    day: string;
    time_slot: string;
    task_detail: string;
    category: string;
    status?: string;
}

export interface ConversationTurn {
  role: 'user' | 'model' | 'system';
  text: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface UserData {
  [userId: string]: {
    user: User;
    plannerData: PlannerCollection;
  };
}
