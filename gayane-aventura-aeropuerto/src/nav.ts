import { createContext, useContext } from 'react';
import type { SceneId } from './data/missions';
export type NavCtx = { go: (s: SceneId, params?: any) => void; params: any };
export const Nav = createContext<NavCtx>({ go: () => {}, params: {} });
export const useNav = () => useContext(Nav);
