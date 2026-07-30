import { checkSupabaseConnection, getSupabase } from "./supabaseClient";

export interface FeedbackNoteRecord {
  id: string;
  createdAt: string;
  userRole: string;
  userName: string;
  text: string;
}

const LOCAL_KEY = "okk_testing_feedback_notes_v2";

function loadLocal(): FeedbackNoteRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(notes: FeedbackNoteRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
}

export async function loadFeedbackNotes(): Promise<FeedbackNoteRecord[]> {
  if (!checkSupabaseConnection()) return loadLocal();
  const { data, error } = await getSupabase()!
    .from("feedback_notes")
    .select("id,author_name,author_role,note_text,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Не удалось загрузить заметки: ${error.message}`);
  const notes = (data || []).map((row: any) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toLocaleString("ru-RU"),
    userName: row.author_name,
    userRole: row.author_role,
    text: row.note_text,
  }));
  saveLocal(notes);
  return notes;
}

export async function saveFeedbackNote(note: FeedbackNoteRecord, authorId: string): Promise<void> {
  const local = [note, ...loadLocal().filter((item) => item.id !== note.id)];
  saveLocal(local);
  if (!checkSupabaseConnection()) return;
  const { error } = await getSupabase()!.from("feedback_notes").insert({
    id: note.id,
    author_id: authorId,
    author_name: note.userName,
    author_role: note.userRole,
    note_text: note.text,
  });
  if (error) throw new Error(`Не удалось сохранить заметку: ${error.message}`);
}

export async function deleteFeedbackNote(id: string): Promise<void> {
  saveLocal(loadLocal().filter((item) => item.id !== id));
  if (!checkSupabaseConnection()) return;
  const { error } = await getSupabase()!.from("feedback_notes").delete().eq("id", id);
  if (error) throw new Error(`Не удалось удалить заметку: ${error.message}`);
}
