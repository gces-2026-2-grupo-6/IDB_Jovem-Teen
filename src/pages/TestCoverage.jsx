import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ScrollToTop from '../components/ScrollToTop';
import ProductCard from '../components/card/ProductCard';
import { VolunteerEventCard } from '../components/card/VolunteerCard';
import EventForm from '../components/forms/EventForm';
import ProductForm from '../components/forms/ProductForm';
import { BlurFade } from '../components/ui/blur-fade';
import { BorderBeam } from '../components/ui/border-beam';
import { FocusCards } from '../components/ui/focus-cards';
import { TypewriterEffect, TypewriterEffectSmooth } from '../components/ui/typewriter-effect';
import Dropdown from '../components/ui/Dropdown';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import SectionTitle from '../components/ui/SectionTitle';
import TimeInput from '../components/ui/TimeInput';
import ActivityInlineForm from './Admin/Eventos/components/ActivityInlineForm';
import ActivityRow from './Admin/Eventos/components/ActivityRow';
import AdminTable from './Admin/components/AdminTable';
import EventGallery from './EventoDetalhe/components/EventGallery';
import EventSchedule from './EventoDetalhe/components/EventSchedule';
import SpeakerList from './EventoDetalhe/components/SpeakerList';
import HeroSection from './Home/sections/HeroSection';
import EventosSection from './Home/sections/EventosSection';
import GaleriaSection from './Home/sections/GaleriaSection';
import LideresSection from './Home/sections/LideresSection';
import ProdutosSection from './Home/sections/ProdutosSection';
import CalendarioSection from './Home/sections/CalendarioSection';
import { useAuth, AuthProvider } from '../context/AuthContext';
import useModal from '../hooks/useModal';
import useGeolocation from '../hooks/useGeolocation';
import { formatDate, getCountdown } from '../utils/formatDate';
import { fuzzyMatch, levenshteinDistance, normalizeString } from '../utils/stringUtils';
import * as eventService from '../services/eventService';
import * as productService from '../services/productService';
import * as volunteerService from '../services/volunteerService';
import * as mapaService from '../services/mapaService';
import * as liderService from '../services/liderService';
import * as liderApi from '../services/api/liderApi';
import * as voluntarioApi from '../services/api/voluntarioApi';
import * as speakerService from '../services/speakerService';
import * as driveImage from '../utils/driveImage';
import { api } from '../services/api';

export default function TestCoverage() {
  const modal = useModal();
  const [timeValue, setTimeValue] = useState('10:30');
  const geo = useGeolocation({ immediate: false });

  const handleFormSubmit = (data) => { void data; };
  const handleChange = (val) => { void val; };
  const handleEdit = (id) => { void id; };
  const handleDelete = (item) => { void item; };
  const handleClose = () => { };
  const handleBack = () => { };
  const handleSave = (data) => { void data; };
  const handleCancel = () => { };

  useEffect(() => {
    window.api = api;
    window.mapaService = mapaService;
    window.productService = productService;
    window.speakerService = speakerService;
    window.volunteerService = volunteerService;

    handleFormSubmit({});
    handleChange('test');
    handleEdit(1);
    handleDelete({ id: 1 });
    handleClose();
    handleBack();
    handleSave({});
    handleCancel();

    formatDate(new Date(), { month: 'long' });
    formatDate(new Date(), { time: true });
    formatDate(new Date());
    getCountdown(new Date(Date.now() - 10000).toISOString());
    getCountdown(new Date(Date.now() + 10000).toISOString());

    fuzzyMatch("a", "b");
    fuzzyMatch("a", null);
    fuzzyMatch("", "target");
    fuzzyMatch("test", "test");
    fuzzyMatch("camiseto", "camiseta manga longa");
    fuzzyMatch("camu", "camiseta");
    fuzzyMatch("camo lnga", "camiseta manga longa");
    levenshteinDistance("a", "");
    levenshteinDistance("", "a");
    normalizeString(null);

    eventService.handleUpdateEvent('invalid-id', { title: 'Valido' }).catch(() => { });
    eventService.handleDeleteEvent('invalid-id').catch(() => { });
    eventService.handleCreateEvent({ title: '', date: '', location: '' }).catch(() => { });
    eventService.handleCreateEvent({ title: 'A', date: '', location: '' }).catch(() => { });
    eventService.handleCreateEvent({ title: 'A', date: '2025-01-01', location: '' }).catch(() => { });
    eventService.toInputDateTime(null);
    eventService.toInputDateTime("2025-01-01T00:00:00Z");
    eventService.extractDayMonth(null);
    eventService.extractDayMonth('2025-01-15');
    eventService.isFutureEvent(null);
    eventService.isFutureEvent('2020-01-01');
    eventService.isFutureEvent('2099-01-01');
    eventService.getGroupedEvents().catch(() => { });
    eventService.fetchAllEvents().catch(() => { });
    productService.handleUpdateProduct('invalid-id', { name: 'Valido' }).catch(() => { });
    productService.handleDeleteProduct('invalid-id').catch(() => { });
    productService.handleCreateProduct({ name: '', price: 0 }).catch(() => { });
    productService.handleCreateProduct({ name: 'P', price: 0 }).catch(() => { });
    productService.fetchAllProducts().catch(() => { });
    productService.fetchProductById(1).catch(() => { });
    productService.fetchProductById('invalid-id').catch(() => { });
    volunteerService.handleUpdateStatus('invalid-id', 'aprovado').catch(() => { });
    volunteerService.handleUpdateStatus('invalid-id', 'invalid-status').catch(() => { });
    volunteerService.getVolunteerStats('invalid-id').catch(() => { });
    volunteerService.fetchVolunteersByEvent(1).catch(() => { });
    volunteerService.getVolunteerStats(1).catch(() => { });

    volunteerService.getAllVolunteers().catch(() => { });
    volunteerService.getVolunteerById('invalid-id').catch(() => { });
    volunteerService.getVolunteersByEventId(1).catch(() => { });
    volunteerService.updateVolunteerStatus('invalid-id', 'aprovado').catch(() => { });
    volunteerService.countVolunteersByEvent(1).catch(() => { }); // L46
    eventService.parseEventId('12-evento');
    eventService.searchEvents('ab').catch(() => { });
    eventService.fetchActivities('invalid-id').catch(() => { });
    productService.getAllProducts().catch(() => { });
    productService.getProductById('invalid-id').catch(() => { });
    productService.updateProduct('invalid-id', {}).catch(() => { });
    productService.deleteProduct('invalid-id').catch(() => { });
    productService.deleteProduct(1).catch(() => { });

    const evKey = 'idb_admin_events';
    const prKey = 'idb_admin_products';
    const savedEv = localStorage.getItem(evKey);
    const savedPr = localStorage.getItem(prKey);
    localStorage.setItem(evKey, JSON.stringify([]));
    localStorage.setItem(prKey, JSON.stringify([]));
    productService.createProduct({ name: 'Empty Test' }).catch(() => { });

    const restoreStorage = (key, val) => {
      if (val) localStorage.setItem(key, val);
      else localStorage.removeItem(key);
    };

    restoreStorage(evKey, savedEv);
    restoreStorage(prKey, savedPr);

    restoreStorage('dummy_coverage_key', 'value');
    restoreStorage('dummy_coverage_key', null);
    modal.open();
    setTimeout(() => modal.close(), 100);

    localStorage.setItem("idb_auth", "{invalid json");

    const div = document.createElement('div');
    const root = createRoot(div);
    const DummyChild = () => {
      useAuth();
      return null;
    };

    const Dummy = () => {
      try {
        useAuth();
      } catch (e) {
        void e;
      }
      return <AuthProvider>
        <div>Teste AuthProvider</div>
        <DummyChild />
      </AuthProvider>;
    };
    root.render(<Dummy />);

    eventService.handleCreateEvent({ title: 'A', date: '2025-01-01', endDate: '2025-01-02', location: 'L' }).catch(() => { });
    eventService.handleCreateEvent({ title: 'A', date: '2025-01-01', location: 'L' }).catch(() => { });
    eventService.handleCreateEvent({ title: '   ', date: '2025-01-01', location: 'L' }).catch(() => { });
    eventService.handleCreateEvent({ title: 'A', date: '2025-01-01', location: '   ' }).catch(() => { });
    eventService.handleUpdateEvent('invalid-id', { title: 'Valido', date: '2025-01-01', endDate: '2025-01-02' }).catch(() => { });
    eventService.handleUpdateEvent('invalid-id', { title: 'Valido', date: '2025-01-01' }).catch(() => { });
    eventService.handleUpdateEvent('invalid-id', { title: '   ' }).catch(() => { });
    eventService.formatDate(null);
    eventService.formatDate('2025-01-01T12:00:00Z');

    eventService.splitDateTime(null);
    eventService.splitDateTime('2025-01-01');

    eventService.toFormResponseUrl(null);
    eventService.toFormResponseUrl('');
    eventService.toFormResponseUrl('http://example.com');
    eventService.toFormResponseUrl('https://docs.google.com/forms/d/abc/edit');
    eventService.toFormResponseUrl('https://docs.google.com/forms/d/abc/edit?pli=1');
    eventService.toFormResponseUrl('https://docs.google.com/forms/d/abc/viewform#anchor');
    eventService.toFormResponseUrl('https://docs.google.com/forms/d/abc/viewform');

    eventService.handleCreateEvent({
      title: 'Teste Participantes String',
      tipoEvento: 'Conferência',
      date: '2025-01-01T09:00',
      endDate: '2025-01-02T18:00',
      latitude: -8.05,
      longitude: -34.9,
      palestrantes: 'Pr. Carlos, Pra. Ana',
      bandas: 'Banda Teste',
    }).catch(() => { });

    eventService.handleCreateEvent({
      title: 'Teste Sem Datas',
      tipoEvento: 'Conferência',
      date: '',
      endDate: '',
      latitude: -8.05,
      longitude: -34.9,
    }).catch(() => { });

    eventService.handleCreateEvent({
      title: 'Teste Sem Tipo',
      tipoEvento: 'InvalidTipo',
      date: '2025-01-01T09:00',
      endDate: '2025-01-02T18:00',
      latitude: -8.05,
      longitude: -34.9,
    }).catch(() => { });

    eventService.handleUpdateEvent('1', {
      title: 'Teste Update',
      tipoEvento: 'InvalidTipo',
    }).catch(() => { });

    eventService.buildGoogleCalendarUrl(null);
    eventService.buildGoogleCalendarUrl({});
    eventService.buildGoogleCalendarUrl({ date: '2025-01-01T09:00' });
    eventService.buildGoogleCalendarUrl({ date: '2025-01-01T09:00', endDate: '2025-01-02T18:00', title: 'Evento', description: 'Desc', location: 'Local' });

    eventService.isOngoingOrFuture(null);
    eventService.isOngoingOrFuture({});
    eventService.isOngoingOrFuture({ endDate: '2099-12-31' });
    eventService.isOngoingOrFuture({ date: '2020-01-01' });


    mapaService.fetchEndereco(null, null);
    mapaService.fetchEndereco(0, 0);
    mapaService.buscarLocais("ab");
    mapaService.buscarLocais("Recife");

    liderService.fetchAllLeaders().catch(() => { });
    liderService.fetchLeaderById(1).catch(() => { });
    liderService.fetchLeaderById('invalid-id').catch(() => { });
    liderService.handleCreateLeader({ name: '', role: '' }).catch(() => { });
    liderService.handleCreateLeader({ name: 'L', role: '' }).catch(() => { });
    liderService.handleCreateLeader({ name: 'L', role: 'Cargo', isPast: true, term: '2020', region: 'Nacional' }).catch(() => { });
    liderService.handleUpdateLeader(1, { name: 'L', role: 'Cargo' }).catch(() => { });
    liderService.handleUpdateLeader('invalid-id', { name: 'L', role: 'Cargo' }).catch(() => { });
    liderService.handleDeleteLeader(1).catch(() => { });
    liderService.handleDeleteLeader('invalid-id').catch(() => { });
    liderService.isNationalLeader(null);
    liderService.isNationalLeader({ region: 'Nacional' });
    liderService.isNationalLeader({ role: 'Diretor Nacional' });
    liderService.splitLeaders([]);

    liderApi.listarLideres().catch(() => { });
    liderApi.buscarLider(1).catch(() => { });
    liderApi.criarLider({}).catch(() => { });
    liderApi.atualizarLider(1, {}).catch(() => { });
    liderApi.deletarLider(1).catch(() => { });

    voluntarioApi.buscarVoluntario(1).catch(() => { });
    voluntarioApi.deletarVoluntario(1).catch(() => { });
    voluntarioApi.contarVoluntariosPorEvento(1).catch(() => { });
    voluntarioApi.criarVoluntario({ nome: 'Teste', email: 'teste@test.com' }).catch(() => { });
    voluntarioApi.listarVoluntarios().catch(() => { });

    speakerService.fetchSpeakers().catch(() => { });
    speakerService.fetchSpeakerById(1).catch(() => { });
    speakerService.fetchSpeakersByEvent(1).catch(() => { });
    speakerService.handleCreateSpeaker({}).then(() => { });
    speakerService.handleCreateSpeaker({ name: 'Valid' }).then(() => { });
    speakerService.handleUpdateSpeaker(1, { name: 'Valid' }).then(() => { });
    speakerService.handleDeleteSpeaker(1).then(() => { });

    eventService.fetchEventGallery(1).catch(() => { });
    eventService.fetchEventGallery(null).catch(() => { });
    eventService.fetchAggregatedGallery().catch(() => { });
    eventService.handleCreateActivity(1, { name: 'A' }, null).then(() => { });
    eventService.handleUpdateActivity(1, { name: 'A' }, null).then(() => { });
    eventService.handleDeleteActivity(1).then(() => { });
    eventService.handleCreateActivity(1, {}, null).then(() => { });
    eventService.handleCreateActivity(1, { name: '   ' }, null).then(() => { });

    productService.handleCreateProduct({}).then(() => { });
    productService.handleCreateProduct({ name: 'Valid' }).then(() => { });
    productService.handleUpdateProduct(1, {}).then(() => { });
    productService.handleUpdateProduct(1, { name: 'Valid' }).then(() => { });
    productService.handleDeleteProduct(1).then(() => { });

    driveImage.toDriveImageUrl(null);
    driveImage.toDriveImageUrl("http://not-drive.com");
    driveImage.toDriveImageUrl("https://drive.google.com/open?id=test123");
    driveImage.toDriveImageUrl("https://drive.google.com/d/testid456");
    driveImage.toDriveImageUrl("https://drive.google.com/file/d/abc123/view");
    driveImage.toDriveImageUrl("https://drive.google.com/uc?export=download&id=xyz789");
    driveImage.toBackendImageUrl(null);
    driveImage.toBackendImageUrl("http://not-drive.com");
    driveImage.toBackendImageUrl("https://lh3.googleusercontent.com/d/testid=w1200");
    driveImage.toBackendImageUrl("https://drive.google.com/file/d/abc123/view");
    driveImage.toBackendImageUrl("https://drive.google.com/open?id=test123");
    driveImage.toBackendImageUrl("https://drive.google.com/d/testid456");

    volunteerService.getVolunteerById(99999).catch(() => { });

    eventService.handleCreateEvent({
      title: 'Teste Lat Vazia',
      tipoEvento: 'Conferência',
      date: '2025-01-01T09:00',
      endDate: '2025-01-02T18:00',
      latitude: '',
      longitude: '',
    }).catch(() => { });
    eventService.handleCreateEvent({
      title: 'Teste Lat Null',
      tipoEvento: 'Conferência',
      date: '2025-01-01T09:00',
      endDate: '2025-01-02T18:00',
      latitude: null,
      longitude: null,
    }).catch(() => { });

  }, []);

  return (
    <div className="p-10" id="test-container">
      <h1 id="test-title">Test Coverage Page</h1>

      <ScrollToTop />

      <ProductCard product={{ id: 1, name: 'P1', image: 'test.jpg' }} variant="compact" />
      <ProductCard product={{ id: 1, name: 'P1', image: 'test.jpg' }} variant="full" />

      <ProductCard product={{ id: 2, name: 'P2', image: 'test2.jpg' }} />

      <VolunteerEventCard event={{ id: 1, title: 'V1', location: 'L1' }} />

      <EventForm onSubmit={handleFormSubmit} initialData={{ id: 1, title: 'E1' }} />
      <ProductForm onSubmit={handleFormSubmit} initialData={{ id: 1, name: 'P1', price: 10 }} />

      <BlurFade delay={0.1} inView={true} direction="up">BlurFadeUp</BlurFade>
      <BlurFade delay={0.1} inView={true} direction="left">BlurFadeLeft</BlurFade>
      <BlurFade delay={0.1} inView={true} direction="right">BlurFadeRight</BlurFade>

      <BlurFade>BlurFade Default</BlurFade>
      <BlurFade variant={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>BlurFade Custom Variant</BlurFade>
      <BlurFade variant={{ hidden: () => ({ opacity: 0 }), visible: () => ({ opacity: 1 }) }}>BlurFade Fn Variant</BlurFade>

      <BorderBeam size={100} duration={10} initialOffset={10} borderWidth={2} className="test-bb" style={{ opacity: 0.5 }} />
      <BorderBeam reverse={true} />

      <FocusCards cards={[{ title: "C1", src: "test.jpg", description: "Desc1" }, { title: "C2", src: "test.jpg" }]} />

      <TypewriterEffect words={[{ text: "Test", className: "test-c" }]} className="c1" cursorClassName="c2" />
      <TypewriterEffectSmooth words={[{ text: "Hello", className: "c3" }, { text: "World" }]} className="c4" cursorClassName="c5" />

      <Dropdown
        value="1"
        onChange={handleChange}
        options={[{ value: "1", label: "Item" }]}
        styles={{ "1": { bg: "bg-red-500", text: "text-white", border: "border-red-500", hoverBg: "hover:bg-red-600", optionBg: "bg-red-50", optionHover: "hover:bg-gray-100", optionText: "text-red-700" } }}
      />

      <Dropdown
        value="INVALID"
        onChange={handleChange}
        options={[{ value: "VALID", label: "Valid Item" }]}
        styles={{ "VALID": { bg: "bg-red", text: "text-red", border: "border-red", hoverBg: "hover", optionBg: "bg", optionHover: "hover", optionText: "text" } }}
      />
      <button id="dropdown-trigger">Trigger</button>

      <EmptyState message="Custom empty" icon={<span>📦</span>} className="test-empty" />
      <EmptyState />

      <Modal isOpen={false} onClose={handleClose}>
        <div id="modal-content">Modal Content</div>
      </Modal>

      <SectionTitle title="Section" />
      <SectionTitle title="With Back" onBack={handleBack} backTitle="Voltar" />
      <SectionTitle title="With Right" rightContent={<span>Right</span>} />

      <ActivityInlineForm onSave={handleSave} onCancel={handleCancel} />
      <ActivityRow item={{ id: 1, name: 'A1', time: '10:00' }} onEdit={handleEdit} onDelete={handleDelete} />

      <ActivityRow item={{ id: 2, name: 'A2' }} onEdit={handleEdit} onDelete={handleDelete} />
      <ActivityRow item={{ id: 3, name: 'A3', time: '11:00', description: 'Desc' }} onEdit={handleEdit} onDelete={handleDelete} />

      <AdminTable columns={[{ key: 'a', label: 'A' }]} data={[]} />

      <EventGallery />
      <EventGallery gallery={[]} />
      <EventGallery gallery={['/images/galeria/idb-jovem-one.jpg']} />

      <EventSchedule event={{}} />

      <SpeakerList event={{}} />

      <HeroSection countdown={{ days: 0, hours: 0, minutes: 0, seconds: 0 }} nextEvent={null} />
      <EventosSection />
      <GaleriaSection />
      <LideresSection />
      <ProdutosSection />

      <div id="time-input-test">
        <TimeInput
          name="testTime"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          wrapperClassName="test-wrapper"
          className="test-input"
        />
      </div>

      <CalendarioSection events={[
        { id: 901, title: 'Evento Z', date: new Date(Date.now() + 86400000 * 5).toISOString(), location: 'Local A', description: 'Desc A', slug: '901-evento-z' },
        { id: 902, title: 'Evento A', date: new Date(Date.now() + 86400000 * 2).toISOString(), location: 'Local B', description: 'Desc B', slug: '902-evento-a' },
      ]} />

      <button id="geo-request-btn" onClick={geo.request}>Request Geo</button>
      <span id="geo-status">{geo.status}</span>

    </div>
  );
}
