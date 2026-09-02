"use client";

/**
 * Proveedor de sesión de usuario.
 *
 * Expone a los componentes del panel el estado de autenticación (usuario,
 * token, si es demo) y las acciones para iniciar/cerrar sesión. Los datos se
 * persisten en localStorage mediante {src/utilidades/sesion}.
 *
 * La autenticación real usa el servicio {src/servicios/autenticacion.servicio}
 * (endpoints /users/login) con modo demo para desarrollo.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CredencialesLogin, UsuarioAutenticado } from "@/tipos";
import {
  esSesionDemo,
  iniciarSesion as iniciarSesionServicio,
} from "@/servicios/autenticacion.servicio";
import {
  cerrarSesionLocal,
  guardarSesion,
  obtenerToken,
  obtenerUsuario,
} from "@/utilidades/sesion";

interface SesionContexto {
  /** Usuario autenticado, o null si no hay sesión. */
  usuario: UsuarioAutenticado | null;
  /** Token JWT actual, o null. */
  token: string | null;
  /** true mientras se restaura la sesión desde localStorage. */
  cargando: boolean;
  /** true si la sesión corresponde al modo demo (datos simulados). */
  esDemo: boolean;
  /** Inicia sesión con las credenciales dadas. */
  iniciarSesion: (credenciales: CredencialesLogin) => Promise<UsuarioAutenticado>;
  /** Cierra la sesión actual. */
  cerrarSesion: () => void;
}

const ContextoSesion = createContext<SesionContexto | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [esDemo, setEsDemo] = useState(false);

  // Restaura la sesión persistida tras el montaje en el cliente.
  useEffect(() => {
    const tokenGuardado = obtenerToken();
    const usuarioGuardado = obtenerUsuario();
    if (tokenGuardado && usuarioGuardado) {
      /* eslint-disable react-hooks/set-state-in-effect -- restauración de sesión persistida */
      setToken(tokenGuardado);
      setUsuario(usuarioGuardado);
      setEsDemo(esSesionDemo(tokenGuardado));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setCargando(false);
  }, []);

  const iniciarSesion = useCallback(
    async (credenciales: CredencialesLogin) => {
      const resultado = await iniciarSesionServicio(credenciales);
      guardarSesion(resultado.token, resultado.usuario);
      setToken(resultado.token);
      setUsuario(resultado.usuario);
      setEsDemo(esSesionDemo(resultado.token));
      return resultado.usuario;
    },
    []
  );

  const cerrarSesion = useCallback(() => {
    cerrarSesionLocal();
    setToken(null);
    setUsuario(null);
    setEsDemo(false);
  }, []);

  return (
    <ContextoSesion.Provider
      value={{ usuario, token, cargando, esDemo, iniciarSesion, cerrarSesion }}
    >
      {children}
    </ContextoSesion.Provider>
  );
}

/** Hook de acceso al contexto de sesión. */
export function useSesion(): SesionContexto {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de <ProveedorSesion>");
  }
  return contexto;
}
