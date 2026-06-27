import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { queryKeys } from "@/lib/queryClient";

type Profile = Tables<"profiles">;
type ProfileUpdate = TablesUpdate<"profiles">;

export const useProfile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.profile(user?.id),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  useEffect(() => {
    if (query.error) {
      console.error("Erro ao carregar perfil:", query.error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do perfil.",
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  const updateProfile = async (updates: Partial<ProfileUpdate>) => {
    if (!user || !query.data) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return false;
    }

    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("user_id", user.id).select().single();
      if (error) throw error;
      queryClient.setQueryData(queryKeys.profile(user.id), data);
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({ title: "Erro", description: "Erro inesperado ao atualizar perfil.", variant: "destructive" });
      return false;
    }
  };

  const createProfile = async (profileData: Omit<Profile, "id" | "created_at" | "updated_at">) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return false;
    }

    try {
      const { data, error } = await supabase.from("profiles").insert({ ...profileData, user_id: user.id }).select().single();
      if (error) throw error;
      queryClient.setQueryData(queryKeys.profile(user.id), data);
      toast({ title: "Sucesso", description: "Perfil criado com sucesso!" });
      return true;
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({ title: "Erro", description: "Erro inesperado ao criar perfil.", variant: "destructive" });
      return false;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const success = await updateProfile({ avatar_url: publicUrl });
      if (success) {
        toast({ title: "Avatar atualizado", description: "Sua foto de perfil foi atualizada com sucesso!" });
        return publicUrl;
      }
      return null;
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({ title: "Erro", description: "Erro inesperado no upload do avatar.", variant: "destructive" });
      return null;
    }
  };

  return {
    profile: query.data || null,
    loading: query.isLoading,
    updateProfile,
    createProfile,
    uploadAvatar,
    refetch: query.refetch,
  };
};
