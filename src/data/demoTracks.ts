import type { SpotifyTrack } from '../types/spotify';

function makeTrack(artistId: string, trackNum: number, name: string, albumName: string): SpotifyTrack {
  return {
    id: `demo-track-${artistId}-${trackNum}`,
    name,
    preview_url: null,
    external_urls: { spotify: '#' },
    album: {
      name: albumName,
      images: [
        { url: `https://placehold.co/300x300/191414/fff?text=${encodeURIComponent(albumName.slice(0, 4))}`, height: 300, width: 300 },
        { url: `https://placehold.co/64x64/191414/fff?text=${encodeURIComponent(albumName.slice(0, 4))}`, height: 64, width: 64 },
      ],
    },
    duration_ms: 200000 + Math.floor(Math.random() * 60000),
  };
}

// 3 tracks per demo artist
export const demoTracks: Record<string, SpotifyTrack[]> = {
  'demo-01': [makeTrack('01', 1, 'Love Story', 'Fearless'), makeTrack('01', 2, 'Shake It Off', '1989'), makeTrack('01', 3, 'Anti-Hero', 'Midnights')],
  'demo-02': [makeTrack('02', 1, 'Hotline Bling', 'Views'), makeTrack('02', 2, 'God\'s Plan', 'Scorpion'), makeTrack('02', 3, 'One Dance', 'Views')],
  'demo-03': [makeTrack('03', 1, 'Blinding Lights', 'After Hours'), makeTrack('03', 2, 'Starboy', 'Starboy'), makeTrack('03', 3, 'Save Your Tears', 'After Hours')],
  'demo-04': [makeTrack('04', 1, 'Dakiti', 'El Ultimo Tour'), makeTrack('04', 2, 'Titi Me Pregunto', 'Un Verano'), makeTrack('04', 3, 'Callaita', 'YHLQMDLG')],
  'demo-05': [makeTrack('05', 1, 'HUMBLE.', 'DAMN.'), makeTrack('05', 2, 'Money Trees', 'GKMC'), makeTrack('05', 3, 'DNA.', 'DAMN.')],
  'demo-06': [makeTrack('06', 1, 'Bad Guy', 'WWAFAWDWG'), makeTrack('06', 2, 'Lovely', 'WWAFAWDWG'), makeTrack('06', 3, 'Happier Than Ever', 'HTE')],
  'demo-07': [makeTrack('07', 1, 'Kill Bill', 'SOS'), makeTrack('07', 2, 'Good Days', 'SOS'), makeTrack('07', 3, 'Kiss Me More', 'SOS')],
  'demo-08': [makeTrack('08', 1, 'Levitating', 'Future Nostalgia'), makeTrack('08', 2, 'Don\'t Start Now', 'Future Nostalgia'), makeTrack('08', 3, 'New Rules', 'Dua Lipa')],
  'demo-09': [makeTrack('09', 1, 'Sunflower', 'Hollywood\'s Bleeding'), makeTrack('09', 2, 'Circles', 'Hollywood\'s Bleeding'), makeTrack('09', 3, 'Rockstar', 'Beerbongs')],
  'demo-10': [makeTrack('10', 1, 'Thank U, Next', 'Thank U Next'), makeTrack('10', 2, '7 Rings', 'Thank U Next'), makeTrack('10', 3, 'Positions', 'Positions')],
  'demo-11': [makeTrack('11', 1, 'SICKO MODE', 'Astroworld'), makeTrack('11', 2, 'Goosebumps', 'Birds'), makeTrack('11', 3, 'HIGHEST IN THE ROOM', 'Astroworld')],
  'demo-12': [makeTrack('12', 1, 'Say So', 'Hot Pink'), makeTrack('12', 2, 'Kiss Me More', 'Planet Her'), makeTrack('12', 3, 'Woman', 'Planet Her')],
  'demo-13': [makeTrack('13', 1, 'Watermelon Sugar', 'Fine Line'), makeTrack('13', 2, 'As It Was', 'Harry\'s House'), makeTrack('13', 3, 'Adore You', 'Fine Line')],
  'demo-14': [makeTrack('14', 1, 'Drivers License', 'SOUR'), makeTrack('14', 2, 'Good 4 U', 'SOUR'), makeTrack('14', 3, 'Deja Vu', 'SOUR')],
  'demo-15': [makeTrack('15', 1, 'Shape of You', 'Divide'), makeTrack('15', 2, 'Perfect', 'Divide'), makeTrack('15', 3, 'Thinking Out Loud', 'Multiply')],
  'demo-16': [makeTrack('16', 1, 'XO Tour Llif3', 'LIR 2'), makeTrack('16', 2, 'Just Wanna Rock', 'Pink Tape'), makeTrack('16', 3, 'Money Longer', 'LIR')],
  'demo-17': [makeTrack('17', 1, 'See You Again', 'Flower Boy'), makeTrack('17', 2, 'EARFQUAKE', 'IGOR'), makeTrack('17', 3, 'NEW MAGIC WAND', 'IGOR')],
  'demo-18': [makeTrack('18', 1, 'Flowers', 'Endless Summer'), makeTrack('18', 2, 'Wrecking Ball', 'Bangerz'), makeTrack('18', 3, 'Party in the USA', 'Breakout')],
  'demo-19': [makeTrack('19', 1, 'Creepin\'', 'Heroes & Villains'), makeTrack('19', 2, 'Superhero', 'Heroes & Villains'), makeTrack('19', 3, 'Too Many Nights', 'Heroes & Villains')],
  'demo-20': [makeTrack('20', 1, 'Halo', 'I Am...Sasha'), makeTrack('20', 2, 'Crazy in Love', 'Dangerously'), makeTrack('20', 3, 'Single Ladies', 'I Am...Sasha')],
  'demo-21': [makeTrack('21', 1, 'Thinkin Bout You', 'Channel Orange'), makeTrack('21', 2, 'Nights', 'Blonde'), makeTrack('21', 3, 'Pink + White', 'Blonde')],
  'demo-22': [makeTrack('22', 1, 'Stronger', 'Graduation'), makeTrack('22', 2, 'Gold Digger', 'Late Reg'), makeTrack('22', 3, 'Runaway', 'MBDTF')],
  'demo-23': [makeTrack('23', 1, 'Umbrella', 'Good Girl'), makeTrack('23', 2, 'We Found Love', 'Talk That Talk'), makeTrack('23', 3, 'Diamonds', 'Unapologetic')],
  'demo-24': [makeTrack('24', 1, 'No Role Modelz', 'FHD'), makeTrack('24', 2, 'Middle Child', 'Singles'), makeTrack('24', 3, 'GOMD', 'FHD')],
  'demo-25': [makeTrack('25', 1, 'Uptown Funk', 'Unorthodox'), makeTrack('25', 2, 'Just the Way You Are', 'Doo-Wops'), makeTrack('25', 3, '24K Magic', '24K Magic')],
  'demo-26': [makeTrack('26', 1, 'Summertime Sadness', 'BTD'), makeTrack('26', 2, 'Video Games', 'BTD'), makeTrack('26', 3, 'Young and Beautiful', 'Gatsby')],
  'demo-27': [makeTrack('27', 1, 'Self Care', 'Swimming'), makeTrack('27', 2, 'Blue World', 'Circles'), makeTrack('27', 3, 'Good News', 'Circles')],
  'demo-28': [makeTrack('28', 1, 'Redbone', 'Awaken My Love'), makeTrack('28', 2, 'This Is America', 'Singles'), makeTrack('28', 3, '3005', 'BTI')],
  'demo-29': [makeTrack('29', 1, 'Do I Wanna Know?', 'AM'), makeTrack('29', 2, 'R U Mine?', 'AM'), makeTrack('29', 3, '505', 'FWN')],
  'demo-30': [makeTrack('30', 1, 'The Less I Know', 'Currents'), makeTrack('30', 2, 'Let It Happen', 'Currents'), makeTrack('30', 3, 'Borderline', 'Slow Rush')],
  'demo-31': [makeTrack('31', 1, 'Bad Habit', 'Gemini Rights'), makeTrack('31', 2, 'Dark Red', 'Apollo XXI'), makeTrack('31', 3, 'Mercury', 'Gemini Rights')],
  'demo-32': [makeTrack('32', 1, 'Motion Sickness', 'Stranger'), makeTrack('32', 2, 'Kyoto', 'Punisher'), makeTrack('32', 3, 'I Know the End', 'Punisher')],
};
