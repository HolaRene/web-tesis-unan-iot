"use client";

/**
 * Proveedor de sesión y perfil de usuario.
 *
 * Expone a los componentes del panel el estado de autenticación (usuario,
 * token, si es demo) y el perfil completo del usuario (nombre, email, rol),
 * además de las acciones para iniciar/cerrar sesión y actualizar el perfil.
 *
 * La autenticación real usa {src/servicios/autenticacion.servicio}
 * (endpoints /users/login, /users/perfil y PATCH /users/:id) con modo demo
 * para desarrollo.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  CredencialesLogin,
  Usuario,
  UsuarioAutenticado,
} from "@/tipos";
import {
  PERFIL_DEMO,
  actualizarPerfilUsuario as actualizarPerfilServicio,
  esSesionDemo,
  iniciarSesion as iniciarSesionServicio,
  obtenerPerfilUsuario as obtenerPerfilServicio,
} from "@/servicios/autenticacion.servicio";
import {
  cerrarSesionLocal,
  guardarPerfil,
  guardarSesion,
  obtenerPerfil,
  obtenerToken,
  obtenerUsuario,
} from "@/utilidades/sesion";

interface SesionContexto {
  /** Usuario autenticado (id/email/rol), o null si no hay sesión. */
  usuario: UsuarioAutenticado | null;
  /** Perfil completo (nombre, email, rol, estado, creado el). */
  perfil: Usuario | null;
  /** Token JWT actual, o null si no hay sesión. */
  token: string | null;
  /** true mientras se restaura la sesión desde localStorage. */
  cargando: boolean;
  /** true si la sesión corresponde al modo demo (datos simulados). */
  esDemo: boolean;
  /** Inicia sesión con las credenciales dadas. */
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<UsuarioAutenticado>;
  /** Vuelve a pedir el perfil completo al backend y actualiza el estado. */
  refrescarPerfil: () => Promise<Usuario | null>;
  /** Actualiza el perfil (nombre/email) en el backend. */
  actualizarPerfil: (datos: {
    nombre: string;
    email: string;
  }) => Promise<Usuario>;
  /** Cierra la sesión actual. */
  cerrarSesion: () => void;
}

const ContextoSesion = createContext<SesionContexto | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [esDemo, setEsDemo] = useState(false);

  /** Carga (o refresca) el perfil según token, en modo demo usa datos simulados. */
  const refrescarPerfil = useCallback(async (): Promise<Usuario | null> => {
    const tokenActual = obtenerToken();
    if (!tokenActual) return null;

    if (esSesionDemo(tokenActual)) {
      setPerfil(PERFIL_DEMO);
      guardarPerfil(PERFIL_DEMO);
      return PERFIL_DEMO;
    }

    try {
      const perfilLeido = await obtenerPerfilServicio();
      setPerfil(perfilLeido);
      guardarPerfil(perfilLeido);
      return perfilLeido;
    } catch {
      // Si falla (backend no disponible), se mantiene lo persistido.
      return obtenerPerfil();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Restaura la sesión y el perfil persistidos tras el montaje del cliente.
  useEffect(() => {
    const tokenGuardado = obtenerToken();
    const usuarioGuardado = obtenerUsuario();
    const perfilGuardado = obtenerPerfil();

    if (tokenGuardado && usuarioGuardado) {
      /* eslint-disable react-hooks/set-state-in-effect -- restauración de sesión */
      setToken(tokenGuardado);
      setUsuario(usuarioGuardado);
      setEsDemo(esSesionDemo(tokenGuardado));
      setPerfil(perfilGuardado);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setCargando(false);

    // En sesiones reales sin perfil persistido, intentamos refrescarlo.
    if (tokenGuardado && !esSesionDemo(tokenGuardado) && !perfilGuardado) {
      refrescarPerfil();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciarSesion = useCallback(
    async (credenciales: CredencialesLogin) => {
      const resultado = await iniciarSesionServicio(credenciales);
      guardarSesion(resultado.token, resultado.usuario);
      setToken(resultado.token);
      setUsuario(resultado.usuario);
      setEsDemo(esSesionDemo(resultado.token));

      // Tras iniciar sesión cargamos el perfil completo (para disponer del nombre).
      setPerfil(null);
      await refrescarPerfil();
      return resultado.usuario;
    },
    [refrescarPerfil]
  );

  const actualizarPerfil = useCallback(
    async (datos: { nombre: string; email: string }) => {
      const idUsuario = usuario?.id ?? perfil?.id;
      if (!idUsuario) {
        throw new Error("Sin sesión activa");
      }
      const perfilActualizado = await actualizarPerfilServicio(idUsuario, datos);
      setPerfil(perfilActualizado);
      guardarPerfil(perfilActualizado);
      // Mantiene email/rol sincronizados en la sesión minimalista.
      if (usuario) {
        const usuarioNuevo = {
          ...usuario,
          email: perfilActualizado.email,
          rol: perfilActualizado.rol,
        };
        setUsuario(usuarioNuevo);
        guardarSesion(token ?? "", usuarioNuevo, perfilActualizado);
      }
      return perfilActualizado;
    },
    [perfil, token, usuario]
  );

  const cerrarSesion = useCallback(() => {
    cerrarSesionLocal();
    setToken(null);
    setUsuario(null);
    setPerfil(null);
    setEsDemo(false);
  }, []);

  return (
    <ContextoSesion.Provider
      value={{
        usuario,
        perfil,
        token,
        cargando,
        esDemo,
        iniciarSesion,
        refrescarPerfil,
        actualizarPerfil,
        cerrarSesion,
      }}
    >
      {children}
    </ContextoSesion.Provider>
  );
}

/** Hook de acceso al contexto de sesión/perfil. */
export function useSesion(): SesionContexto {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de <ProveedorSesion>");
  }
  return contexto;
}
