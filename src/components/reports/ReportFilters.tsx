import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  X, 
  CalendarIcon, 
  Tag, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { FinancialProfile } from "@/components/dashboard/ProfileSwitcher";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ReportFiltersState {
  categories: string[];
  transactionType: "all" | "income" | "expense";
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  minAmount: string;
  maxAmount: string;
}

interface ReportFiltersProps {
  profileType: FinancialProfile;
  filters: ReportFiltersState;
  onFiltersChange: (filters: ReportFiltersState) => void;
  onApplyFilters: (filters?: ReportFiltersState) => void;
}

export const defaultFilters: ReportFiltersState = {
  categories: [],
  transactionType: "all",
  dateFrom: undefined,
  dateTo: undefined,
  minAmount: "",
  maxAmount: "",
};

export const ReportFilters = ({
  profileType,
  filters,
  onFiltersChange,
  onApplyFilters,
}: ReportFiltersProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [profileType]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("categories")
        .select("id, name, icon, color")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("name");

      if (data) setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
    onApplyFilters(defaultFilters);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.transactionType !== "all" ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "";

  // Count only advanced filters (transaction type is always visible now)
  const activeFiltersCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.minAmount || filters.maxAmount ? 1 : 0);

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardContent className="p-5">
        {/* Quick Transaction Type Filter - Always Visible */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
          <div className="flex gap-1">
            <Button
              variant={filters.transactionType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const nextFilters = { ...filters, transactionType: "all" as const };
                onFiltersChange(nextFilters);
                onApplyFilters(nextFilters);
              }}
              className="h-9 rounded-xl"
            >
              Todas
            </Button>
            <Button
              variant={filters.transactionType === "income" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const nextFilters = { ...filters, transactionType: "income" as const };
                onFiltersChange(nextFilters);
                onApplyFilters(nextFilters);
              }}
              className={cn(
                "h-9 gap-1 rounded-xl",
                filters.transactionType === "income" && "bg-success hover:bg-success/90"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Receitas
            </Button>
            <Button
              variant={filters.transactionType === "expense" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const nextFilters = { ...filters, transactionType: "expense" as const };
                onFiltersChange(nextFilters);
                onApplyFilters(nextFilters);
              }}
              className={cn(
                "h-9 gap-1 rounded-xl",
                filters.transactionType === "expense" && "bg-danger hover:bg-danger/90"
              )}
            >
              <TrendingDown className="h-3 w-3" />
              Despesas
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-t pt-4">
          <Button
            variant="ghost"
            className="gap-2 p-0 h-auto hover:bg-transparent"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-semibold">Mais Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && !isExpanded && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.categories.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {filters.categories.length} categoria(s)
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    const nextFilters = { ...filters, categories: [] };
                    onFiltersChange(nextFilters);
                    onApplyFilters(nextFilters);
                  }}
                />
              </Badge>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="outline" className="gap-1">
                <CalendarIcon className="h-3 w-3" />
                {filters.dateFrom && format(filters.dateFrom, "dd/MM/yy", { locale: ptBR })}
                {filters.dateFrom && filters.dateTo && " - "}
                {filters.dateTo && format(filters.dateTo, "dd/MM/yy", { locale: ptBR })}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    const nextFilters = { ...filters, dateFrom: undefined, dateTo: undefined };
                    onFiltersChange(nextFilters);
                    onApplyFilters(nextFilters);
                  }}
                />
              </Badge>
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <Badge variant="outline" className="gap-1">
                R$ {filters.minAmount || "0"} - R$ {filters.maxAmount || "∞"}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    const nextFilters = { ...filters, minAmount: "", maxAmount: "" };
                    onFiltersChange(nextFilters);
                    onApplyFilters(nextFilters);
                  }}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Filter Form */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categorias</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                    className={cn(
                        "flex items-center gap-2 rounded-xl border p-2 text-sm transition-colors cursor-pointer",
                        filters.categories.includes(category.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={filters.categories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <span className="text-base">{category.icon}</span>
                      <span className="truncate">{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start rounded-xl text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? (
                        format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) =>
                        onFiltersChange({ ...filters, dateFrom: date })
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start rounded-xl text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) =>
                        onFiltersChange({ ...filters, dateTo: date })
                      }
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Mínimo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.minAmount}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, minAmount: e.target.value })
                    }
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Máximo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="Sem limite"
                    value={filters.maxAmount}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, maxAmount: e.target.value })
                    }
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end pt-2">
              <Button onClick={() => onApplyFilters(filters)} className="h-11 gap-2 rounded-xl px-6">
                <Filter className="h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
