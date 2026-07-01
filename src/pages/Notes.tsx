import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  StickyNote, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  Search,
  Palette,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Color schemes that work in both light and dark modes
const NOTE_COLORS = [
  { name: "Amarelo", light: "hsl(48, 96%, 89%)", dark: "hsl(48, 50%, 25%)" },
  { name: "Verde", light: "hsl(152, 76%, 91%)", dark: "hsl(152, 40%, 22%)" },
  { name: "Azul", light: "hsl(213, 93%, 93%)", dark: "hsl(213, 50%, 25%)" },
  { name: "Rosa", light: "hsl(330, 80%, 94%)", dark: "hsl(330, 45%, 25%)" },
  { name: "Roxo", light: "hsl(250, 80%, 95%)", dark: "hsl(250, 40%, 25%)" },
  { name: "Laranja", light: "hsl(27, 96%, 86%)", dark: "hsl(27, 50%, 25%)" },
  { name: "Cinza", light: "hsl(220, 10%, 96%)", dark: "hsl(220, 15%, 20%)" },
  { name: "Padrão", light: "hsl(0, 0%, 100%)", dark: "hsl(220, 15%, 16%)" },
];

export default function Notes() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Helper to get the correct color based on theme
  const getColorValue = useCallback((colorKey: string) => {
    const colorEntry = NOTE_COLORS.find(c => c.name === colorKey) || NOTE_COLORS[0];
    return isDark ? colorEntry.dark : colorEntry.light;
  }, [isDark]);

  // Helper to find color name from stored value (for migration/compatibility)
  const findColorName = useCallback((storedColor: string) => {
    const entry = NOTE_COLORS.find(c => c.light === storedColor || c.dark === storedColor);
    return entry?.name || "Amarelo";
  }, []);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    colorName: "Amarelo", // Store color name instead of value
  });
  const [saving, setSaving] = useState(false);
  const cardClass = "rounded-2xl border-border/80 bg-card shadow-sm";

  const loadNotes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes((data as Note[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar notas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        (note.content && note.content.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.is_pinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter((n) => !n.is_pinned), [filteredNotes]);

  const openNewNote = () => {
    setEditingNote(null);
    setFormData({ title: "", content: "", colorName: "Amarelo" });
    setDialogOpen(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content || "",
      colorName: findColorName(note.color),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingNote) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: formData.title.trim(),
            content: formData.content.trim() || null,
            color: getColorValue(formData.colorName),
          })
          .eq("id", editingNote.id);

        if (error) throw error;
        toast.success("Nota atualizada!");
      } else {
        const { error } = await supabase.from("notes").insert({
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim() || null,
          color: getColorValue(formData.colorName),
        });

        if (error) throw error;
        toast.success("Nota criada!");
      }

      setDialogOpen(false);
      loadNotes();
    } catch (error: any) {
      toast.error("Erro ao salvar nota: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_pinned: !note.is_pinned })
        .eq("id", note.id);

      if (error) throw error;
      toast.success(note.is_pinned ? "Nota desafixada" : "Nota fixada");
      loadNotes();
    } catch (error: any) {
      toast.error("Erro ao atualizar nota: " + error.message);
    }
  };

  const confirmDelete = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteToDelete);

      if (error) throw error;
      toast.success("Nota excluída");
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      loadNotes();
    } catch (error: any) {
      toast.error("Erro ao excluir nota: " + error.message);
    }
  };

  const NoteCard = ({ note }: { note: Note }) => {
    // Get the themed color for this note
    const noteColorName = findColorName(note.color);
    const themedColor = getColorValue(noteColorName);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="group relative min-h-[210px] cursor-pointer overflow-hidden rounded-2xl border-border/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: themedColor }}
          onClick={() => openEditNote(note)}
        >
        {note.is_pinned && (
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-primary shadow-sm backdrop-blur">
            <Pin className="h-4 w-4 fill-primary" />
          </div>
        )}
        <CardHeader className="pb-3">
          <h3 className="line-clamp-1 pr-8 text-lg font-bold text-foreground">
            {note.title}
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="min-h-[4.5rem] text-sm leading-6 text-muted-foreground line-clamp-3">
            {note.content || "Sem conteúdo"}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3">
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.updated_at), "dd MMM yyyy", { locale: ptBR })}
            </span>
            <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/50 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(note);
                }}
              >
                {note.is_pinned ? (
                  <PinOff className="h-3.5 w-3.5" />
                ) : (
                  <Pin className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/50 text-destructive hover:bg-background hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(note.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
          </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  };

  if (loading) {
    return (
      <AppLayout title="Bloco de Notas">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Carregando notas...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Bloco de Notas">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <StickyNote className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                Bloco de Notas
              </h1>
              <p className="mt-1 max-w-2xl text-lg text-muted-foreground">
                Guarde ideias, lembretes e observações importantes em um só lugar.
              </p>
            </div>
          </div>
          <Button onClick={openNewNote} className="h-12 rounded-2xl px-6 text-base font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Nova Nota
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl pl-10 shadow-sm"
          />
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <Card className={`${cardClass} p-12 text-center`}>
            <StickyNote className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-xl font-bold">Nenhuma nota ainda</h3>
            <p className="mb-5 text-muted-foreground">
              Crie sua primeira nota para começar a organizar suas ideias
            </p>
            <Button onClick={openNewNote} className="h-12 rounded-2xl px-6 font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Nota
            </Button>
          </Card>
        ) : filteredNotes.length === 0 ? (
          <Card className={`${cardClass} p-10 text-center`}>
            <Search className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhuma nota encontrada para "{searchQuery}"
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  <Pin className="h-4 w-4" />
                  Fixadas
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence>
                    {pinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Other Notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Outras notas
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence>
                    {unpinnedNotes.map((note) => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Editar Nota" : "Nova Nota"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Título da nota"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="h-12 rounded-2xl text-lg font-semibold"
                style={{ backgroundColor: getColorValue(formData.colorName) }}
              />
            </div>
            <div>
              <Textarea
                placeholder="Escreva sua nota aqui..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="min-h-[220px] resize-none rounded-2xl"
                style={{ backgroundColor: getColorValue(formData.colorName) }}
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4" />
                Cor da nota
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTE_COLORS.map((colorOption) => (
                  <button
                    key={colorOption.name}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, colorName: colorOption.name })
                    }
                    className={`h-9 w-9 rounded-full border-2 transition-all ${
                      formData.colorName === colorOption.name
                        ? "border-primary ring-2 ring-primary/30 scale-110"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{ backgroundColor: isDark ? colorOption.dark : colorOption.light }}
                    title={colorOption.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A nota será permanentemente
              removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
