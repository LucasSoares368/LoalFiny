import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BadgePercent,
  Package,
  Plus,
  ReceiptText,
  ShoppingCart,
  Store,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { StoreManager } from "@/components/market/StoreManager";
import { ProductManager } from "@/components/market/ProductManager";
import { PriceRecorder } from "@/components/market/PriceRecorder";
import { PriceComparison } from "@/components/market/PriceComparison";
import { BestDeals } from "@/components/market/BestDeals";
import { ShoppingList } from "@/components/market/ShoppingList";

export interface StoreType {
  id: string;
  name: string;
  location: string | null;
  color: string;
}

export interface ProductType {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  icon: string;
}

export interface PriceRecordType {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  quantity: number;
  date: string;
  products?: ProductType;
  stores?: StoreType;
}

const tabs = [
  { value: "shopping", label: "Lista", icon: ShoppingCart },
  { value: "comparison", label: "Comparar", icon: TrendingDown },
  { value: "deals", label: "Ofertas", icon: BadgePercent },
  { value: "prices", label: "Registrar", icon: Plus },
  { value: "products", label: "Produtos", icon: Package },
  { value: "stores", label: "Lojas", icon: Store },
];

const formatDate = (value?: string) => {
  if (!value) return "Sem registros";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sem registros";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const Market = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [priceRecords, setPriceRecords] = useState<PriceRecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shopping");

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [storesRes, productsRes, pricesRes] = await Promise.all([
        supabase.from("stores").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase.from("price_records").select("*, products(*), stores(*)").order("date", { ascending: false }),
      ]);

      if (storesRes.error) throw storesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (pricesRes.error) throw pricesRes.error;

      setStores((storesRes.data as StoreType[]) || []);
      setProducts((productsRes.data as ProductType[]) || []);
      setPriceRecords((pricesRes.data as PriceRecordType[]) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar mercado: " + (error.message || "tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const latestPriceDate = priceRecords[0]?.date;
  const uniquePricedProducts = useMemo(
    () => new Set(priceRecords.map((record) => record.product_id)).size,
    [priceRecords],
  );

  return (
    <AppLayout title="Mercado">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-normal text-foreground">Mercado</h1>
              <p className="text-lg text-muted-foreground">
                Organize compras, registre preços e encontre onde vale mais a pena comprar.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MarketMetric icon={Store} label="Lojas" value={stores.length} description="Estabelecimentos cadastrados" />
            <MarketMetric icon={Package} label="Produtos" value={products.length} description="Itens monitorados" />
            <MarketMetric icon={ReceiptText} label="Preços" value={priceRecords.length} description="Registros no histórico" />
            <MarketMetric icon={TrendingDown} label="Monitorados" value={uniquePricedProducts} description={`Atualizado em ${formatDate(latestPriceDate)}`} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="max-w-full overflow-hidden">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1 sm:grid-cols-3 xl:grid-cols-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="h-11 min-w-0 rounded-xl px-3 text-sm font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"
                    >
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {loading ? (
              <div className="space-y-5">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-80 rounded-2xl" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="shopping" className="mt-0">
                    <ShoppingList />
                  </TabsContent>

                  <TabsContent value="comparison" className="mt-0">
                    <PriceComparison products={products} stores={stores} priceRecords={priceRecords} />
                  </TabsContent>

                  <TabsContent value="deals" className="mt-0">
                    <BestDeals products={products} stores={stores} priceRecords={priceRecords} />
                  </TabsContent>

                  <TabsContent value="prices" className="mt-0">
                    <PriceRecorder products={products} stores={stores} onRecordAdded={loadData} />
                  </TabsContent>

                  <TabsContent value="products" className="mt-0">
                    <ProductManager products={products} onProductsChange={loadData} />
                  </TabsContent>

                  <TabsContent value="stores" className="mt-0">
                    <StoreManager stores={stores} onStoresChange={loadData} />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            )}
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
};

interface MarketMetricProps {
  icon: typeof Store;
  label: string;
  value: string | number;
  description: string;
}

const MarketMetric = ({ icon: Icon, label, value, description }: MarketMetricProps) => (
  <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
    <CardContent className="flex min-h-32 items-center justify-between gap-4 p-6">
      <div>
        <div className="mb-3 flex items-center gap-3 text-muted-foreground">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold">{label}</span>
        </div>
        <p className="text-3xl font-bold text-primary">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default Market;
