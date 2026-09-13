import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import MainLayoutNoFooter from "../layouts/MainLayoutNoFooter";
import AdminLayout from "../layouts/AdminLayout";

import AdminRoute from "./AdminRoute";
import SuperAdminRoute from "./SuperAdminRoute";

import Home from "../pages/Home";
import Eventos from "../pages/Eventos";
import EventosProximos from "../pages/EventosProximos";
import EventoDetalhe from "../pages/EventoDetalhe";
import Galeria from "../pages/Galeria";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import TestCoverage from "../pages/TestCoverage";

import AdminDashboard from "../pages/Admin/Dashboard";
import AdminEventos from "../pages/Admin/Eventos";
import AdminEventoCreate from "../pages/Admin/Eventos/Create";
import AdminEventoDetails from "../pages/Admin/Eventos/Details";
import AdminEventoEdit from "../pages/Admin/Eventos/Edit";
import AdminEventoEditSchedule from "../pages/Admin/Eventos/EditSchedule";
import AdminProdutos from "../pages/Admin/Produtos";
import AdminProdutoCreate from "../pages/Admin/Produtos/Create";
import AdminProdutoEdit from "../pages/Admin/Produtos/Edit";
import AdminVoluntarios from "../pages/Admin/Voluntarios";
import AdminVoluntarioDetails from "../pages/Admin/Voluntarios/Details";
import AdminLideres from "../pages/Admin/Lideres";
import AdminLiderCreate from "../pages/Admin/Lideres/Create";
import AdminLiderEdit from "../pages/Admin/Lideres/Edit";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/eventos" element={<AdminEventos />} />
          <Route path="/admin/eventos/criar" element={<AdminEventoCreate />} />
          <Route path="/admin/eventos/:id" element={<AdminEventoDetails />} />
          <Route path="/admin/eventos/:id/editar" element={<AdminEventoEdit />} />
          <Route path="/admin/eventos/:id/programacao" element={<AdminEventoEditSchedule />} />
          <Route path="/admin/produtos" element={<AdminProdutos />} />
          <Route element={<SuperAdminRoute />}>
            <Route path="/admin/produtos/criar" element={<AdminProdutoCreate />} />
            <Route path="/admin/produtos/:id/editar" element={<AdminProdutoEdit />} />
          </Route>
          <Route path="/admin/voluntarios" element={<AdminVoluntarios />} />
          <Route path="/admin/voluntarios/:eventId" element={<AdminVoluntarioDetails />} />
          <Route element={<SuperAdminRoute />}>
            <Route path="/admin/lideres" element={<AdminLideres />} />
            <Route path="/admin/lideres/criar" element={<AdminLiderCreate />} />
            <Route path="/admin/lideres/:id/editar" element={<AdminLiderEdit />} />
          </Route>
        </Route>
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/eventos-proximos" element={<EventosProximos />} />
        <Route path="/eventos/:slug" element={<EventoDetalhe />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/test-coverage" element={<TestCoverage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<MainLayoutNoFooter />}>
        <Route path="/login" element={<Login />} />
      </Route>
    </Routes>
  );
}
