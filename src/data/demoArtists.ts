import type { SpotifyArtist } from '../types/spotify';

function makeArtist(
  id: string,
  name: string,
  popularity: number,
  genres: string[],
  initials: string,
): SpotifyArtist {
  const color = popularity > 80 ? '1db954' : popularity > 70 ? '1ed760' : '535353';
  return {
    id: `demo-${id}`,
    name,
    popularity,
    genres,
    images: [
      { url: `https://placehold.co/640x640/${color}/fff?text=${encodeURIComponent(initials)}`, height: 640, width: 640 },
      { url: `https://placehold.co/300x300/${color}/fff?text=${encodeURIComponent(initials)}`, height: 300, width: 300 },
      { url: `https://placehold.co/64x64/${color}/fff?text=${encodeURIComponent(initials)}`, height: 64, width: 64 },
    ],
  };
}

export const demoArtists: SpotifyArtist[] = [
  makeArtist('01', 'Taylor Swift', 95, ['pop', 'country pop'], 'TS'),
  makeArtist('02', 'Drake', 93, ['hip hop', 'rap'], 'DR'),
  makeArtist('03', 'The Weeknd', 92, ['r&b', 'pop'], 'TW'),
  makeArtist('04', 'Bad Bunny', 91, ['reggaeton', 'latin'], 'BB'),
  makeArtist('05', 'Kendrick Lamar', 90, ['hip hop', 'rap'], 'KL'),
  makeArtist('06', 'Billie Eilish', 89, ['pop', 'electropop'], 'BE'),
  makeArtist('07', 'SZA', 88, ['r&b', 'neo soul'], 'SZ'),
  makeArtist('08', 'Dua Lipa', 87, ['pop', 'dance pop'], 'DL'),
  makeArtist('09', 'Post Malone', 86, ['pop rap', 'hip hop'], 'PM'),
  makeArtist('10', 'Ariana Grande', 85, ['pop', 'r&b'], 'AG'),
  makeArtist('11', 'Travis Scott', 84, ['hip hop', 'trap'], 'TS'),
  makeArtist('12', 'Doja Cat', 83, ['pop', 'rap'], 'DC'),
  makeArtist('13', 'Harry Styles', 82, ['pop', 'rock'], 'HS'),
  makeArtist('14', 'Olivia Rodrigo', 81, ['pop', 'indie pop'], 'OR'),
  makeArtist('15', 'Ed Sheeran', 80, ['pop', 'singer-songwriter'], 'ES'),
  makeArtist('16', 'Lil Uzi Vert', 79, ['hip hop', 'trap'], 'LU'),
  makeArtist('17', 'Tyler, the Creator', 78, ['hip hop', 'alternative'], 'TC'),
  makeArtist('18', 'Miley Cyrus', 77, ['pop', 'rock'], 'MC'),
  makeArtist('19', 'Metro Boomin', 76, ['hip hop', 'trap'], 'MB'),
  makeArtist('20', 'Beyonce', 75, ['r&b', 'pop'], 'BY'),
  makeArtist('21', 'Frank Ocean', 74, ['r&b', 'alternative'], 'FO'),
  makeArtist('22', 'Kanye West', 73, ['hip hop', 'rap'], 'KW'),
  makeArtist('23', 'Rihanna', 72, ['pop', 'r&b'], 'RH'),
  makeArtist('24', 'J. Cole', 71, ['hip hop', 'rap'], 'JC'),
  makeArtist('25', 'Bruno Mars', 70, ['pop', 'r&b'], 'BM'),
  makeArtist('26', 'Lana Del Rey', 69, ['indie pop', 'dream pop'], 'LR'),
  makeArtist('27', 'Mac Miller', 68, ['hip hop', 'jazz rap'], 'MM'),
  makeArtist('28', 'Childish Gambino', 67, ['hip hop', 'r&b'], 'CG'),
  makeArtist('29', 'Arctic Monkeys', 66, ['indie rock', 'rock'], 'AM'),
  makeArtist('30', 'Tame Impala', 65, ['psychedelic rock', 'indie'], 'TI'),
  makeArtist('31', 'Steve Lacy', 64, ['r&b', 'indie'], 'SL'),
  makeArtist('32', 'Phoebe Bridgers', 63, ['indie rock', 'folk'], 'PB'),
];
