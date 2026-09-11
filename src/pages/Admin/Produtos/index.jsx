import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { fetchAllProducts, handleDeleteProduct } from "../../../services/productService";
import usePermissao from "../../../hooks/usePermissao";
import useModal from "../../../hooks/useModal";
import SectionTitle from "../../../components/ui/SectionTitle";
import EmptyState from "../../../components/ui/EmptyState";
import Loading from "../../../components/ui/Loading";
import ProductCard from "../../../components/card/ProductCard";
import DeleteProductModal from "./components/DeleteProductModal";

export default function AdminProdutos() {
  const navigate = useNavigate();
  /* Criar e editar pertencem ao setor da loja; excluir, só o superadmin. */
  const { podeExcluir } = usePermissao();
  const deleteModal = useModal();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await fetchAllProducts();
        if (!active) return;
        setProducts(all);
        setError(null);
      } catch {
        if (active) setError("Não foi possível carregar os produtos.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleEdit = (id) => {
    navigate(`/admin/produtos/${id}/editar`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.data) return;
    const result = await handleDeleteProduct(deleteModal.data.id);
    deleteModal.close();
    if (result.success) {
      setReloadKey((k) => k + 1);
    } else {
      alert(result.error);
    }
  };

  const rightContent = (
    <Link
      to="/admin/produtos/criar"
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm"
    >
      Cadastrar Produto
      <Plus size={18} />
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <SectionTitle title="Produtos" rightContent={rightContent} />

      {/* Estados */}
      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState message={error} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="full"
              onEdit={handleEdit}
              onDelete={podeExcluir ? (p) => deleteModal.open(p) : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhum produto cadastrado." />
      )}

      {/* Modal de exclusão */}
      <DeleteProductModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
