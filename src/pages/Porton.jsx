import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Plus, Edit2, Trash2, Save, X, Key, Home, AlertCircle, Loader, Phone, Search, Filter } from 'lucide-react';

const Porton = () => {
  const { userData } = useAuth();
  const [gateNumbers, setGateNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ number: '', phoneNumber: '', houseId: '', notes: '' });
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Filtros tipo Excel
  const [filterNumber, setFilterNumber] = useState('all');
  const [filterHouse, setFilterHouse] = useState('all');

  useEffect(() => {
    loadGateNumbers();
  }, []);

  const loadGateNumbers = async () => {
    try {
      setLoading(true);
      const gateRef = collection(firestore, 'gateNumbers');
      const snapshot = await getDocs(gateRef);
      const numbers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => {
        const numA = parseInt(a.number) || 0;
        const numB = parseInt(b.number) || 0;
        return numA - numB;
      });
      setGateNumbers(numbers);
    } catch (error) {
      console.error('Error al cargar números de portón:', error);
      alert('Error al cargar los números de portón');
    } finally {
      setLoading(false);
    }
  };

  const handleMassImport = async () => {
    if (!confirm('¿Desea importar 187 números de portón? Esta acción agregará todos los datos del Excel.')) {
      return;
    }

    setImporting(true);

    const initialData = [
      { serie: 1, telefono: "0056998333808", nombre: "Daniela Ramos", parcela: "house6" },
      { serie: 2, telefono: "0056958696399", nombre: "Daniela Ramos", parcela: "house6" },
      { serie: 3, telefono: "0056994389277", nombre: "Jessica Vilches", parcela: "house7" },
      { serie: 4, telefono: "0056991958383", nombre: "Jessica Vilches", parcela: "house7" },
      { serie: 5, telefono: "0056993357721", nombre: "Juan Miranda", parcela: "house10" },
      { serie: 6, telefono: "0056993324968", nombre: "Juan Miranda", parcela: "house10" },
      { serie: 7, telefono: "0056978314810", nombre: "Andrea Ramirez", parcela: "house11" },
      { serie: 8, telefono: "0056920092185", nombre: "Andrea Ramirez", parcela: "house11" },
      { serie: 9, telefono: "0056992432600", nombre: "Miguel Muñoz", parcela: "house12" },
      { serie: 10, telefono: "0056977081283", nombre: "Miguel Muñoz", parcela: "house12" },
      { serie: 11, telefono: "0056964150510", nombre: "Victor Miranda", parcela: "house15" },
      { serie: 12, telefono: "0056978430168", nombre: "Victor Miranda", parcela: "house15" },
      { serie: 13, telefono: "0056982283150", nombre: "Carlos Valdebenito", parcela: "house16B" },
      { serie: 14, telefono: "0056962281528", nombre: "Carlos Valdebenito", parcela: "house16B" },
      { serie: 15, telefono: "0056951899022", nombre: "Mauricio Parra", parcela: "house17" },
      { serie: 16, telefono: "0056977575159", nombre: "Mauricio Parra", parcela: "house17" },
      { serie: 17, telefono: "0056996806568", nombre: "Amadeos Manrique", parcela: "house18B" },
      { serie: 18, telefono: "0056950158775", nombre: "Cesar Escobar", parcela: "house19" },
      { serie: 19, telefono: "0056990699086", nombre: "Cesar Escobar", parcela: "house19" },
      { serie: 20, telefono: "0056981352523", nombre: "Francisco Muñoz", parcela: "house23" },
      { serie: 21, telefono: "0056978069213", nombre: "Jesus", parcela: "house26" },
      { serie: 22, telefono: "0056932630489", nombre: "Eduardo Urrutia", parcela: "house28A" },
      { serie: 23, telefono: "0056961819067", nombre: "Eduardo Urrutia", parcela: "house28A" },
      { serie: 24, telefono: "0056984620797", nombre: "Marcela Ortiz", parcela: "house28B" },
      { serie: 25, telefono: "0056948617626", nombre: "Marcela Ortiz", parcela: "house28B" },
      { serie: 26, telefono: "56920135594", nombre: "Fernando Quezada", parcela: "house30" },
      { serie: 27, telefono: "0056998491087", nombre: "Evelyn Burrows", parcela: "house33" },
      { serie: 28, telefono: "0056993090908", nombre: "Carla Caceres", parcela: "house33" },
      { serie: 29, telefono: "0056997320578", nombre: "Carolina Ibacache", parcela: "house36A" },
      { serie: 30, telefono: "0056976183065", nombre: "Julia", parcela: "house36B" },
      { serie: 31, telefono: "0056997837128", nombre: "Julia", parcela: "house36B" },
      { serie: 32, telefono: "0056950114890", nombre: "Luz Burrows", parcela: "house45" },
      { serie: 33, telefono: "0056978525702", nombre: "Luz Burrows", parcela: "house45" },
      { serie: 34, telefono: "0056966293645", nombre: "Edith Castro", parcela: "house48" },
      { serie: 35, telefono: "0056991995484", nombre: "Marisol", parcela: "house48B" },
      { serie: 36, telefono: "0056988081122", nombre: "Juan C. Quezada", parcela: "house49B" },
      { serie: 37, telefono: "0056999378058", nombre: "Juan C. Quezada", parcela: "house49B" },
      { serie: 38, telefono: "0056958299747", nombre: "Guillermo Salgado", parcela: "house51" },
      { serie: 39, telefono: "0056988913477", nombre: "German Alvarez", parcela: "house51" },
      { serie: 40, telefono: "0056982015106", nombre: "Claudio", parcela: "house63" },
      { serie: 41, telefono: "0056944438756", nombre: "Boris Castro", parcela: "house66" },
      { serie: 42, telefono: "0056995771194", nombre: "Berta Pizarro", parcela: "house71B" },
      { serie: 43, telefono: "0056993151897", nombre: "Berta Pizarro", parcela: "house71B" },
      { serie: 44, telefono: "0056950566344", nombre: "Leslye", parcela: "house73A" },
      { serie: 45, telefono: "0056984945244", nombre: "Oscar", parcela: "house74" },
      { serie: 46, telefono: "0056966275023", nombre: "Joselyn", parcela: "house74" },
      { serie: 47, telefono: "0056977107196", nombre: "Edwin Quezada", parcela: "house76" },
      { serie: 48, telefono: "0056992815699", nombre: "Rosa Basaez", parcela: "house76" },
      { serie: 49, telefono: "0056996990425", nombre: "Gianni Olivari", parcela: "house77" },
      { serie: 50, telefono: "0056961530802", nombre: "Gianni Olivari", parcela: "house77" },
      { serie: 51, telefono: "0056975721528", nombre: "Raquel Roa", parcela: "house82" },
      { serie: 52, telefono: "0056978066643", nombre: "Boris Castro", parcela: "house66" },
      { serie: 53, telefono: "0056977667568", nombre: "Alejandro", parcela: "house90" },
      { serie: 54, telefono: "0056992100982", nombre: "Alejandro", parcela: "house90" },
      { serie: 55, telefono: "0056985412790", nombre: "Oscar Altamirano", parcela: "house95" },
      { serie: 56, telefono: "0056995401527", nombre: "Francislene", parcela: "house96" },
      { serie: 57, telefono: "0056956148667", nombre: "Francislene", parcela: "house96" },
      { serie: 58, telefono: "0056934236989", nombre: "Anibal Miranda", parcela: "house15B" },
      { serie: 59, telefono: "0056920485697", nombre: "Samira Ardiles", parcela: "house15B" },
      { serie: 60, telefono: "0056998265875", nombre: "Juan Astudillo", parcela: "house110" },
      { serie: 61, telefono: "0056991517731", nombre: "Juan Astudillo", parcela: "house110" },
      { serie: 62, telefono: "0056990823357", nombre: "Andres Miranda", parcela: "house115" },
      { serie: 63, telefono: "0056957117293", nombre: "Leslye", parcela: "house73A" },
      { serie: 64, telefono: "0056937649714", nombre: "Jairo Carvajal", parcela: "house68" },
      { serie: 65, telefono: "0056999215395", nombre: "Sra Jairo Carvajal", parcela: "house68" },
      { serie: 66, telefono: "0056977692112", nombre: "Ingrid Gonzales", parcela: "house95" },
      { serie: 67, telefono: "0056950573658", nombre: "Eduardo Morales", parcela: "house89" },
      { serie: 68, telefono: "0056982274630", nombre: "Karent Arancibia", parcela: "house89" },
      { serie: 69, telefono: "0056966188877", nombre: "Patricio Ponce", parcela: "house84" },
      { serie: 70, telefono: "0056982919271", nombre: "Patricio Ponce", parcela: "house84" },
      { serie: 71, telefono: "0056987684125", nombre: "Carmen Pizarro", parcela: "house87" },
      { serie: 72, telefono: "0056968603800", nombre: "Jessica Vilches", parcela: "house7B" },
      { serie: 73, telefono: "0056942373491", nombre: "Carmen Pizarro", parcela: "house87" },
      { serie: 74, telefono: "0056971384859", nombre: "Carolina Ibacache", parcela: "house36A" },
      { serie: 75, telefono: "0056942508219", nombre: "Carolina Ibacache", parcela: "house36A" },
      { serie: 76, telefono: "0056979675851", nombre: "Francisco Muñoz", parcela: "house23" },
      { serie: 77, telefono: "0056994696990", nombre: "Delegado Rural", parcela: "200" },
      { serie: 78, telefono: "0056966806105", nombre: "Catalina", parcela: "house25" },
      { serie: 79, telefono: "0056985177914", nombre: "Catalina", parcela: "house25" },
      { serie: 80, telefono: "0056989122270", nombre: "marcelo", parcela: "house78" },
      { serie: 81, telefono: "0056967685129", nombre: "susana", parcela: "house78" },
      { serie: 82, telefono: "0056990711287", nombre: "Margot", parcela: "house65A" },
      { serie: 83, telefono: "0056942779604", nombre: "Esposo Margot", parcela: "house65A" },
      { serie: 84, telefono: "0056941660207", nombre: "Camion Agua", parcela: "Municipalidad" },
      { serie: 85, telefono: "0056991702827", nombre: "Carlos Riquelme", parcela: "house107" },
      { serie: 86, telefono: "0056998210174", nombre: "Daniela paz", parcela: "house9" },
      { serie: 87, telefono: "0056968394466", nombre: "Giorgio", parcela: "house9" },
      { serie: 88, telefono: "0056951387837", nombre: "Sebastian", parcela: "house4" },
      { serie: 89, telefono: "0056996554117", nombre: "Ignacia", parcela: "house4" },
      { serie: 90, telefono: "0056959199945", nombre: "mauricio miranda", parcela: "house104" },
      { serie: 91, telefono: "0056979462018", nombre: "Tatiana Lagos", parcela: "house30" },
      { serie: 92, telefono: "0056975219665", nombre: "cristi billy", parcela: "house26A" },
      { serie: 93, telefono: "0056965963154", nombre: "Edith", parcela: "house48" },
      { serie: 94, telefono: "0056948425391", nombre: "Daniela Ramos", parcela: "house6" },
      { serie: 95, telefono: "0056956163425", nombre: "Daniela Ramos", parcela: "house6" },
      { serie: 96, telefono: "0056983628202", nombre: "Viviana", parcela: "house26B" },
      { serie: 97, telefono: "0056944480296", nombre: "Ringo", parcela: "house26B" },
      { serie: 98, telefono: "0056979876587", nombre: "Enrique", parcela: "house16A" },
      { serie: 99, telefono: "0056984005920", nombre: "Marisol", parcela: "house48B" },
      { serie: 100, telefono: "0056988885321", nombre: "Fredy", parcela: "house63" },
      { serie: 101, telefono: "0056995879671", nombre: "Carla Navarro", parcela: "house19B" },
      { serie: 102, telefono: "0056998284767", nombre: "Gerson Arancibia", parcela: "house19B" },
      { serie: 103, telefono: "0056981379268", nombre: "Cesar Miranda", parcela: "house88" },
      { serie: 104, telefono: "0056997169481", nombre: "Catalina Miranda", parcela: "house88" },
      { serie: 105, telefono: "0056947891009", nombre: "Jose Juan", parcela: "house112" },
      { serie: 106, telefono: "0056983862883", nombre: "Juan Jose", parcela: "house112" },
      { serie: 107, telefono: "0056991598343", nombre: "Virginia", parcela: "house83" },
      { serie: 108, telefono: "0056992394439", nombre: "Juan", parcela: "house83" },
      { serie: 109, telefono: "0056981379434", nombre: "Rosa Rojas", parcela: "house22" },
      { serie: 110, telefono: "0056974077597", nombre: "Cesar Negrete", parcela: "house75" },
      { serie: 111, telefono: "0056967872406", nombre: "Cesar Negrete", parcela: "house75" },
      { serie: 112, telefono: "0056940269558", nombre: "Carlos Allende", parcela: "house80" },
      { serie: 113, telefono: "0056983921024", nombre: "Debora Albornoz", parcela: "house80" },
      { serie: 114, telefono: "0056947085838", nombre: "Max Valdivieso", parcela: "house62" },
      { serie: 115, telefono: "0056921698515", nombre: "Marcela Valdivieso", parcela: "house62" },
      { serie: 116, telefono: "0056931869412", nombre: "Eduardo Matute", parcela: "house29" },
      { serie: 117, telefono: "0056974191849", nombre: "Fernando Leal", parcela: "house29" },
      { serie: 118, telefono: "0056998298045", nombre: "Rosa Rojas", parcela: "house22" },
      { serie: 119, telefono: "0056997995270", nombre: "Cesar Miranda", parcela: "house18A" },
      { serie: 120, telefono: "0056993093267", nombre: "Cesar Miranda", parcela: "house18A" },
      { serie: 121, telefono: "0056928514027", nombre: "Marcela Ortiz", parcela: "house28B" },
      { serie: 122, telefono: "0056962883637", nombre: "Marcela Ortiz", parcela: "house28B" },
      { serie: 123, telefono: "0056995784429", nombre: "Gerardo Manriquez", parcela: "house64" },
      { serie: 124, telefono: "0056967207437", nombre: "Gerardo Manriquez", parcela: "house64" },
      { serie: 125, telefono: "0056971627727", nombre: "Efrain Duarte", parcela: "house20A" },
      { serie: 126, telefono: "0056930915765", nombre: "Efrain Duarte", parcela: "house20A" },
      { serie: 127, telefono: "0056934475532", nombre: "Sin asignar", parcela: "house42" },
      { serie: 128, telefono: "0056944015838", nombre: "Sin asignar", parcela: "house42" },
      { serie: 129, telefono: "0056987071646", nombre: "Sin asignar", parcela: "house51B" },
      { serie: 130, telefono: "0056963407181", nombre: "Sin asignar", parcela: "house58" },
      { serie: 131, telefono: "0056983988681", nombre: "Sin asignar", parcela: "house58" },
      { serie: 132, telefono: "0056982698626", nombre: "Pablo", parcela: "house44" },
      { serie: 133, telefono: "0056973801706", nombre: "Pablo", parcela: "house44" },
      { serie: 134, telefono: "0056985488498", nombre: "Franchesca", parcela: "house85" },
      { serie: 135, telefono: "0056968395591", nombre: "Franchesca", parcela: "house85" },
      { serie: 136, telefono: "0056978181966", nombre: "Jacque", parcela: "house108" },
      { serie: 137, telefono: "0056978656062", nombre: "Jacque", parcela: "house108" },
      { serie: 138, telefono: "0056940621973", nombre: "Cristina", parcela: "house46" },
      { serie: 139, telefono: "0056977649685", nombre: "Raquel Fletes", parcela: "house82" },
      { serie: 140, telefono: "0056987600838", nombre: "Sin asignar", parcela: "house81" },
      { serie: 141, telefono: "0056971927254", nombre: "Sin asignar", parcela: "house81" },
      { serie: 142, telefono: "0056977388257", nombre: "Gladys arriagada", parcela: "house60" },
      { serie: 143, telefono: "0056963743355", nombre: "Gladys arriagada", parcela: "house60" },
      { serie: 144, telefono: "0056944480296", nombre: "Eduardo Hernandez", parcela: "house26" },
      { serie: 145, telefono: "0056983628202", nombre: "Eduardo Hernandez", parcela: "house26" },
      { serie: 146, telefono: "0056942779604", nombre: "Margot", parcela: "house65" },
      { serie: 147, telefono: "0056977007935", nombre: "Claudia Zacarias", parcela: "house43" },
      { serie: 148, telefono: "0056976409758", nombre: "Claudia Zacarias", parcela: "house43" },
      { serie: 149, telefono: "0056966923526", nombre: "Luzmira Arancibia", parcela: "house66" },
      { serie: 150, telefono: "0056978797147", nombre: "Sin asignar", parcela: "house69" },
      { serie: 151, telefono: "0056981268608", nombre: "Sin asignar", parcela: "house69" },
      { serie: 152, telefono: "0056956571214", nombre: "Coke", parcela: "house36B" },
      { serie: 153, telefono: "0056987684137", nombre: "Carmen Pizarro", parcela: "house87" },
      { serie: 154, telefono: "0056966762652", nombre: "Carmen Pizarro", parcela: "house87" },
      { serie: 155, telefono: "0056968412762", nombre: "Sin asignar", parcela: "house41A" },
      { serie: 156, telefono: "0056966555233", nombre: "Sin asignar", parcela: "house41A" },
      { serie: 157, telefono: "0056989621704", nombre: "cristina clark burrows", parcela: "house46" },
      { serie: 158, telefono: "0056983238299", nombre: "Rodri Quezada", parcela: "house49B" },
      { serie: 159, telefono: "0056946917451", nombre: "Constanza Quezada", parcela: "house49B" },
      { serie: 160, telefono: "0056968161576", nombre: "Alexia", parcela: "house67A" },
      { serie: 161, telefono: "0056985169717", nombre: "Fernanda", parcela: "house67A" },
      { serie: 162, telefono: "0056996206885", nombre: "Camion Agua", parcela: "Municipalidad" },
      { serie: 163, telefono: "0056998291374", nombre: "Daniela Estay", parcela: "house50" },
      { serie: 164, telefono: "0056976560659", nombre: "Daniela Estay", parcela: "house50" },
      { serie: 165, telefono: "0056982379493", nombre: "Nacho Quezada", parcela: "house76" },
      { serie: 166, telefono: "0056989621432", nombre: "Toño Quezada", parcela: "house76" },
      { serie: 167, telefono: "0056989980583", nombre: "Sin asignar", parcela: "house79" },
      { serie: 168, telefono: "0056976001755", nombre: "Sin asignar", parcela: "house79" },
      { serie: 169, telefono: "0056984479116", nombre: "Juan Perez", parcela: "house73" },
      { serie: 170, telefono: "0056975868775", nombre: "Valesca Sepulveda", parcela: "house73" },
      { serie: 171, telefono: "0056978797156", nombre: "Sin asignar", parcela: "house90" },
      { serie: 172, telefono: "0056982383199", nombre: "Sin asignar", parcela: "house90" },
      { serie: 173, telefono: "0056998265875", nombre: "Juan Astudillo N", parcela: "house110" },
      { serie: 174, telefono: "0056991517731", nombre: "Juan Astudillo Q", parcela: "house110" },
      { serie: 175, telefono: "0056978047574", nombre: "amor", parcela: "house29" },
      { serie: 176, telefono: "0056962048175", nombre: "mama", parcela: "house29" },
      { serie: 177, telefono: "0056951054277", nombre: "Sin asignar", parcela: "house106" },
      { serie: 178, telefono: "0056981311925", nombre: "Sin asignar", parcela: "house106" },
      { serie: 179, telefono: "0056995143297", nombre: "Cynthia Avendaño", parcela: "house59" },
      { serie: 180, telefono: "0056984070644", nombre: "Cristian Medina", parcela: "house59" },
      { serie: 181, telefono: "0056974307046", nombre: "Gloria Caceres", parcela: "house35" },
      { serie: 182, telefono: "0056974304011", nombre: "Pedro", parcela: "house35" },
      { serie: 183, telefono: "0056998625922", nombre: "Antonia Gonzales", parcela: "house7B" },
      { serie: 184, telefono: "0056974300349", nombre: "David", parcela: "house35" },
      { serie: 185, telefono: "0056976230337", nombre: "Gilsa", parcela: "house51A" },
      { serie: 186, telefono: "0056997305955", nombre: "Aida Espinoza", parcela: "house111" },
      { serie: 187, telefono: "0056967430919", nombre: "Jorge Fuentes", parcela: "house111" }
    ];

    try {
      const gateRef = collection(firestore, 'gateNumbers');
      let importados = 0;

      for (const item of initialData) {
        await addDoc(gateRef, {
          number: item.serie.toString(),
          phoneNumber: item.telefono,
          houseId: item.parcela,
          notes: item.nombre,
          createdAt: new Date().toISOString(),
          createdBy: userData?.uid || 'admin',
          importedAt: new Date().toISOString()
        });
        importados++;
      }

      alert(`✅ Importación exitosa: ${importados} números de portón agregados`);
      loadGateNumbers();
    } catch (error) {
      console.error('Error en importación:', error);
      alert('❌ Error durante la importación. Revise la consola para más detalles.');
    } finally {
      setImporting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.number || !formData.houseId) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const gateRef = collection(firestore, 'gateNumbers');
      await addDoc(gateRef, {
        number: formData.number,
        phoneNumber: formData.phoneNumber || '',
        houseId: formData.houseId,
        notes: formData.notes || '',
        createdAt: new Date().toISOString(),
        createdBy: userData?.uid || 'system'
      });

      setFormData({ number: '', phoneNumber: '', houseId: '', notes: '' });
      setShowAddForm(false);
      loadGateNumbers();
      alert('✅ Número agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar:', error);
      alert('❌ Error al agregar el número');
    }
  };

  const handleEdit = async (id) => {
    if (!formData.number || !formData.houseId) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    try {
      const gateDoc = doc(firestore, 'gateNumbers', id);
      await updateDoc(gateDoc, {
        number: formData.number,
        phoneNumber: formData.phoneNumber || '',
        houseId: formData.houseId,
        notes: formData.notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: userData?.uid || 'system'
      });

      setEditingId(null);
      setFormData({ number: '', phoneNumber: '', houseId: '', notes: '' });
      loadGateNumbers();
      alert('✅ Número actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('❌ Error al actualizar el número');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este número de portón?')) return;

    try {
      await deleteDoc(doc(firestore, 'gateNumbers', id));
      loadGateNumbers();
      alert('✅ Número eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('❌ Error al eliminar el número');
    }
  };

  const startEdit = (number) => {
    setEditingId(number.id);
    setFormData({
      number: number.number || '',
      phoneNumber: number.phoneNumber || '',
      houseId: number.houseId || '',
      notes: number.notes || ''
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ number: '', phoneNumber: '', houseId: '', notes: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  // Obtener valores únicos para los filtros
  const uniqueNumbers = ['all', ...new Set(gateNumbers.map(n => n.number).filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b)))];
  
  // Ordenar parcelas de menor a mayor (extrayendo el número de "house6", "house10", etc.)
  const uniqueHouses = ['all', ...new Set(gateNumbers.map(n => n.houseId).filter(Boolean))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    
    // Extraer números de las parcelas (ej: "house6" -> 6, "house10A" -> 10)
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    
    return numA - numB;
  });

  // Filtrar números de portón con filtros tipo Excel
  const filteredGateNumbers = gateNumbers.filter(number => {
    // Filtro de búsqueda de texto (todas las columnas)
    const matchesSearch = !searchTerm || (
      number.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      number.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      number.houseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      number.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtros tipo Excel (coincidencia exacta)
    const matchesNumber = filterNumber === 'all' || number.number === filterNumber;
    const matchesHouse = filterHouse === 'all' || number.houseId === filterHouse;

    return matchesSearch && matchesNumber && matchesHouse;
  });

  const stats = {
    total: gateNumbers.length,
    houses: new Set(gateNumbers.map(n => n.houseId)).size,
    average: gateNumbers.length > 0 ? (gateNumbers.length / new Set(gateNumbers.map(n => n.houseId)).size).toFixed(1) : 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Key className="w-8 h-8 text-primary-600" />
            Gestión de Portón de Acceso
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Administre los números telefónicos asignados al portón de acceso
          </p>
        </div>
        <div className="flex gap-2">
          {gateNumbers.length === 0 && (
            <button
              onClick={handleMassImport}
              disabled={importing}
              className="btn-secondary flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Importar Datos del Excel
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({ number: '', phoneNumber: '', houseId: '', notes: '' });
            }}
            className="btn-primary flex items-center gap-2"
          >
            {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showAddForm ? 'Cancelar' : 'Agregar Número'}
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Números</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <Key className="w-12 h-12 text-primary-600 opacity-20" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Parcelas con Acceso</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.houses}</p>
            </div>
            <Home className="w-12 h-12 text-primary-600 opacity-20" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Promedio por Parcela</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.average}</p>
            </div>
            <Phone className="w-12 h-12 text-primary-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="card p-6 space-y-4">
        {/* Búsqueda de texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filtros tipo Excel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              N° Serie
            </label>
            <select
              value={filterNumber}
              onChange={(e) => setFilterNumber(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos ({uniqueNumbers.length - 1})</option>
              {uniqueNumbers.filter(n => n !== 'all').map(num => (
                <option key={num} value={num}>Serie {num}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Home className="inline w-4 h-4 mr-1" />
              Parcela
            </label>
            <select
              value={filterHouse}
              onChange={(e) => setFilterHouse(e.target.value)}
              className="input-field"
            >
              <option value="all">Todas ({uniqueHouses.length - 1})</option>
              {uniqueHouses.filter(h => h !== 'all').map(house => (
                <option key={house} value={house}>
                  {house.startsWith('house') ? `Parcela ${house.replace('house', '')}` : house}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Mostrando {filteredGateNumbers.length} de {gateNumbers.length} números
          </p>
          {(searchTerm || filterNumber !== 'all' || filterHouse !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterNumber('all');
                setFilterHouse('all');
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Formulario Agregar */}
      {showAddForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Agregar Nuevo Número de Portón
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                N° Serie (Caja) *
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="input"
                placeholder="Ej: 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número de Teléfono
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input"
                placeholder="Ej: 0056912345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Parcela Asignada *
              </label>
              <input
                type="text"
                value={formData.houseId}
                onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                className="input"
                placeholder="Ej: house6 o house16A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notas
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input"
                placeholder="Ej: Nombre del residente"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ number: '', phoneNumber: '', houseId: '', notes: '' });
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  N° Serie
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Parcela
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notas
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredGateNumbers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {searchTerm 
                        ? 'No se encontraron números que coincidan con la búsqueda'
                        : 'No hay números de portón registrados'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGateNumbers.map((number) => (
                  <tr key={number.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === number.id ? (
                        <input
                          type="text"
                          value={formData.number}
                          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                          className="input input-sm"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-primary-600">
                          {number.number}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === number.id ? (
                        <input
                          type="text"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="input input-sm"
                        />
                      ) : (
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {number.phoneNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === number.id ? (
                        <input
                          type="text"
                          value={formData.houseId}
                          onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                          className="input input-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {number.houseId?.startsWith('house') 
                            ? `Parcela ${number.houseId.replace('house', '')}`
                            : number.houseId
                          }
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === number.id ? (
                        <input
                          type="text"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="input input-sm"
                        />
                      ) : (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {number.notes || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === number.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(number.id)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-slate-600 hover:text-slate-900 dark:hover:text-slate-400"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEdit(number)}
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(number.id)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Porton;
