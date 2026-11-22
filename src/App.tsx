import { useCallback, useEffect, useState } from 'react';
import type { SceneId } from './data/missions';
import { Nav } from './nav';
import { Toasts } from './ui/Hud';
import { StartScreen } from './scenes/Start';
import { JourneyMap } from './scenes/JourneyMap';
import { Room } from './scenes/Room';
import { TaxiScene, ArrivalScene } from './scenes/Simple';
import { Hall } from './scenes/Hall';
import { Security } from './scenes/Security';
import { Maze } from './scenes/Maze';
import { Cafe } from './scenes/Cafe';
import { Boarding } from './scenes/Boarding';
import { Flight } from './scenes/Flight';
import { Pilot } from './scenes/Pilot';
import { Baggage } from './scenes/Baggage';
import { Madrid } from './scenes/Madrid';
import { PassportScreen } from './scenes/Passport';
import { Dictionary } from './scenes/Dictionary';
import { Wardrobe } from './scenes/Wardrobe';
import { Checkin } from './scenes/Checkin';

export default function App() {
  const [scene, setScene] = useState<{ id: SceneId; params: any; key: number }>({ id: 'start', params: {}, key: 0 });
  const go = useCallback((id: SceneId, params: any = {}) => {
    window.speechSynthesis?.cancel();
    setScene((s) => ({ id, params, key: s.key + 1 }));
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [scene.key]);
  const S = {
    start: StartScreen, map: JourneyMap, room: Room, taxi: TaxiScene, hall: Hall, checkin: Checkin, security: Security, maze: Maze,
    cafe: Cafe, boarding: Boarding, flight: Flight, pilot: Pilot, arrival: ArrivalScene, baggage: Baggage, madrid: Madrid,
    passport: PassportScreen, dict: Dictionary, wardrobe: Wardrobe,
  }[scene.id];
  return (
    <Nav.Provider value={{ go, params: scene.params }}>
      <div className="app">
        <S key={scene.key} />
        <Toasts />
      </div>
    </Nav.Provider>
  );
}
