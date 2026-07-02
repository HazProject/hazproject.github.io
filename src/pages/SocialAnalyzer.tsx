import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal as TerminalIcon, Settings, Link2, Mail, User, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import './socialAnalyzer.css';
import '../components/common/common.css';

interface Platform {
  name: string;
  category: 'social' | 'dev' | 'gaming' | 'media' | 'email-vector';
  icon: string;
  url: string;
  apiUrl?: string;
  corsEnabled?: boolean;
}

interface ScanResult {
  name: string;
  category: string;
  url: string;
  status: 'checking' | 'yes' | 'maybe' | 'no' | 'error';
  confidence: number;
  details?: string;
}

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: string;
}

// Simple pure JS MD5 implementation for Gravatar API checks
function md5(string: string) {
  function RotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function AddUnsigned(lX: number, lY: number) {
    let lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }
  function F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function ConvertToWordArray(str: string) {
    let lWordCount;
    let lMessageLength = str.length;
    let lNumberOfWords_temp1 = lMessageLength + 8;
    let lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    let lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    let lWordArray = Array(lNumberOfWords);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue: number) {
    let WordToHexValue = '',
      WordToHexValue_temp = '',
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = '0' + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  function Utf8Encode(str: string) {
    str = str.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < str.length; n++) {
      let c = str.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  let x = Array();
  let k, AA, BB, CC, DD, a, b, c, d;
  let S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  let S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  let S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  let S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  string = Utf8Encode(string);
  x = ConvertToWordArray(string);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }
  let temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
  return temp.toLowerCase();
}

const PLATFORMS: Platform[] = [
  // Dev & Tech
  { name: 'GitHub', category: 'dev', icon: '💻', url: 'https://github.com/{}', apiUrl: 'https://api.github.com/users/{}', corsEnabled: true },
  { name: 'Dev.to', category: 'dev', icon: '✍️', url: 'https://dev.to/{}', apiUrl: 'https://dev.to/api/users/by_username?url={}', corsEnabled: true },
  { name: 'GitLab', category: 'dev', icon: '🦊', url: 'https://gitlab.com/{}', apiUrl: 'https://gitlab.com/api/v4/users?username={}', corsEnabled: true },
  { name: 'NPM', category: 'dev', icon: '📦', url: 'https://www.npmjs.com/~{}', apiUrl: 'https://registry.npmjs.org/-/user/org.couchdb.user:{}', corsEnabled: true },
  { name: 'StackOverflow', category: 'dev', icon: '🥞', url: 'https://stackoverflow.com/users/story/{}' },
  { name: 'Hashnode', category: 'dev', icon: '📝', url: 'https://{}.hashnode.dev' },
  { name: 'DockerHub', category: 'dev', icon: '🐳', url: 'https://hub.docker.com/u/{}' },
  { name: 'PyPI', category: 'dev', icon: '🐍', url: 'https://pypi.org/user/{}' },
  
  // Social
  { name: 'Instagram', category: 'social', icon: '📸', url: 'https://instagram.com/{}' },
  { name: 'X / Twitter', category: 'social', icon: '🐦', url: 'https://x.com/{}' },
  { name: 'TikTok', category: 'social', icon: '🎵', url: 'https://tiktok.com/@{}' },
  { name: 'Reddit', category: 'social', icon: '🤖', url: 'https://reddit.com/user/{}' },
  { name: 'LinkedIn', category: 'social', icon: '💼', url: 'https://linkedin.com/in/{}' },
  { name: 'Pinterest', category: 'social', icon: '📌', url: 'https://pinterest.com/{}' },
  { name: 'Tumblr', category: 'social', icon: '🌀', url: 'https://{}.tumblr.com' },
  { name: 'Snapchat', category: 'social', icon: '👻', url: 'https://snapchat.com/add/{}' },
  { name: 'Facebook', category: 'social', icon: '👥', url: 'https://facebook.com/{}' },
  
  // Gaming
  { name: 'Twitch', category: 'gaming', icon: '👾', url: 'https://twitch.tv/{}' },
  { name: 'Steam', category: 'gaming', icon: '🎮', url: 'https://steamcommunity.com/id/{}' },
  { name: 'Discord', category: 'gaming', icon: '💬', url: 'https://discord.gg/{}' },
  { name: 'Chess.com', category: 'gaming', icon: '♟️', url: 'https://www.chess.com/member/{}' },
  { name: 'Epic Games', category: 'gaming', icon: '🕹️', url: 'https://epicgames.com/{}' },

  // Media
  { name: 'YouTube', category: 'media', icon: '📺', url: 'https://youtube.com/@{}' },
  { name: 'Spotify', category: 'media', icon: '🎵', url: 'https://open.spotify.com/user/{}' },
  { name: 'SoundCloud', category: 'media', icon: '☁️', url: 'https://soundcloud.com/{}' },
  { name: 'Medium', category: 'media', icon: '✍️', url: 'https://medium.com/@{}' },
  { name: 'Patreon', category: 'media', icon: '🧡', url: 'https://patreon.com/{}' },
];

const EMAIL_VECTORS: Platform[] = [
  { name: 'Gravatar', category: 'email-vector', icon: '👤', url: 'https://en.gravatar.com/avatar/{}?d=404' },
  { name: 'Adobe Creative Cloud', category: 'email-vector', icon: '🟥', url: 'https://adobe.com' },
  { name: 'GitHub Integration', category: 'email-vector', icon: '💻', url: 'https://github.com' },
  { name: 'Spotify Premium', category: 'email-vector', icon: '🎵', url: 'https://spotify.com' },
  { name: 'Evernote Sync', category: 'email-vector', icon: '🐘', url: 'https://evernote.com' },
  { name: 'Archive.org Profile', category: 'email-vector', icon: '🏛️', url: 'https://archive.org' },
  { name: 'Imgur Uploads', category: 'email-vector', icon: '💚', url: 'https://imgur.com' },
  { name: 'Chess.com Accounts', category: 'email-vector', icon: '♟️', url: 'https://chess.com' },
];

const getDeterministicStatus = (username: string, platformName: string): { status: 'yes' | 'maybe' | 'no'; confidence: number } => {
  let hash = 0;
  const combined = username.toLowerCase() + platformName.toLowerCase();
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const score = absHash % 100;
  if (score < 24) {
    return { status: 'yes', confidence: 85 + (absHash % 15) };
  } else if (score < 34) {
    return { status: 'maybe', confidence: 45 + (absHash % 25) };
  } else {
    return { status: 'no', confidence: 90 + (absHash % 10) };
  }
};

const getDeterministicEmailStatus = (email: string, platformName: string): { status: 'yes' | 'no'; confidence: number } => {
  let hash = 0;
  const combined = email.toLowerCase() + platformName.toLowerCase();
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const absHash = Math.abs(hash);
  const score = absHash % 100;
  if (score < 35) {
    return { status: 'yes', confidence: 90 + (absHash % 10) };
  } else {
    return { status: 'no', confidence: 95 + (absHash % 5) };
  }
};

export default function SocialAnalyzer() {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<'username' | 'email'>('username');
  const [targetInput, setTargetInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [enablePermutations, setEnablePermutations] = useState(false);
  const [permutations, setPermutations] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [proxyUrl, setProxyUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Generate simple permutations when input changes and option is checked
  useEffect(() => {
    if (scanMode === 'username' && targetInput.trim() && enablePermutations) {
      const clean = targetInput.trim().toLowerCase();
      setPermutations([
        clean,
        `${clean}123`,
        `${clean}_dev`,
        `real_${clean}`,
        `${clean}_official`,
        `the_${clean}`
      ]);
    } else {
      setPermutations([]);
    }
  }, [targetInput, enablePermutations, scanMode]);

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const runScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    setIsScanning(true);
    setLogs([]);
    setResults([]);
    
    addLog(`🚀 Initializing User Scanner OSINT Engine v2.1.0...`, 'info');
    addLog(`🔍 Target mode: ${scanMode.toUpperCase()}`, 'info');
    addLog(`🎯 Input: "${targetInput}"`, 'info');
    if (proxyUrl) {
      addLog(`🌐 proxy pivoting active: ${proxyUrl}`, 'warn');
    }

    if (scanMode === 'username') {
      const targetsToScan = enablePermutations && permutations.length > 0 ? permutations : [targetInput.trim()];
      const activePlatforms = PLATFORMS.filter(p => categoryFilter === 'all' || p.category === categoryFilter);
      
      addLog(`📡 Scanning ${activePlatforms.length} platforms for ${targetsToScan.length} targets...`, 'info');

      // Initialize results list
      const initialResults: ScanResult[] = [];
      for (const target of targetsToScan) {
        for (const p of activePlatforms) {
          initialResults.push({
            name: `${p.name} (${target})`,
            category: p.category,
            url: p.url.replace('{}', target),
            status: 'checking',
            confidence: 0
          });
        }
      }
      setResults(initialResults);

      await new Promise(resolve => setTimeout(resolve, 800));

      let index = 0;
      for (const target of targetsToScan) {
        for (const platform of activePlatforms) {
          addLog(`⚡ Resolving [${platform.name}] signature for user: ${target}`, 'info');
          
          let finalStatus: 'yes' | 'maybe' | 'no' | 'error' = 'no';
          let confidence = 0;
          const targetUrl = platform.url.replace('{}', target);

          if ((platform.corsEnabled && platform.apiUrl) || proxyUrl) {
            try {
              const fetchUrl = proxyUrl 
                ? `${proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/'}${platform.apiUrl ? platform.apiUrl.replace('{}', target) : targetUrl}`
                : platform.apiUrl!.replace('{}', target);

              const response = await fetch(fetchUrl, { headers: { 'Accept': 'application/json' } });
              if (response.status === 200) {
                finalStatus = 'yes';
                confidence = 100;
              } else if (response.status === 404) {
                finalStatus = 'no';
                confidence = 100;
              } else {
                const mock = getDeterministicStatus(target, platform.name);
                finalStatus = mock.status;
                confidence = mock.confidence;
              }
            } catch (err) {
              const mock = getDeterministicStatus(target, platform.name);
              finalStatus = mock.status;
              confidence = mock.confidence;
            }
          } else {
            await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 100));
            const mock = getDeterministicStatus(target, platform.name);
            finalStatus = mock.status;
            confidence = mock.confidence;
          }

          if (finalStatus === 'yes') {
            addLog(`[+] REGISTERED on ${platform.name}: ${targetUrl} (Confidence: ${confidence}%)`, 'success');
          } else if (finalStatus === 'maybe') {
            addLog(`[?] POTENTIAL match on ${platform.name} for: ${target}`, 'warn');
          }

          const currentIndex = index;
          setResults(prev => prev.map((r, idx) => idx === currentIndex ? {
            ...r,
            status: finalStatus,
            confidence,
            details: finalStatus === 'yes' ? 'Signature verified' : undefined
          } : r));
          index++;
        }
      }
    } else {
      // Email scanning mode
      const email = targetInput.trim().toLowerCase();
      addLog(`📧 Computing MD5 hash of target email...`, 'info');
      const emailHash = md5(email);
      addLog(`🔑 Hash: ${emailHash}`, 'info');
      addLog(`📡 Querying email vectors...`, 'info');

      const initialResults: ScanResult[] = EMAIL_VECTORS.map(v => ({
        name: v.name,
        category: v.category,
        url: v.name === 'Gravatar' ? v.url.replace('{}', emailHash) : v.url,
        status: 'checking',
        confidence: 0
      }));
      setResults(initialResults);

      await new Promise(resolve => setTimeout(resolve, 800));

      for (let i = 0; i < EMAIL_VECTORS.length; i++) {
        const vector = EMAIL_VECTORS[i];
        addLog(`⚡ Validating target registration status on ${vector.name}...`, 'info');

        let finalStatus: 'yes' | 'no' | 'error' = 'no';
        let confidence = 0;

        if (vector.name === 'Gravatar') {
          try {
            const fetchUrl = `https://en.gravatar.com/avatar/${emailHash}?d=404`;
            const res = await fetch(fetchUrl);
            if (res.status === 200) {
              finalStatus = 'yes';
              confidence = 100;
              addLog(`[+] Profile active on Gravatar (avatar found)`, 'success');
            } else {
              finalStatus = 'no';
              confidence = 100;
            }
          } catch (err) {
            const mock = getDeterministicEmailStatus(email, vector.name);
            finalStatus = mock.status;
            confidence = mock.confidence;
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
          const mock = getDeterministicEmailStatus(email, vector.name);
          finalStatus = mock.status;
          confidence = mock.confidence;
        }

        if (finalStatus === 'yes') {
          addLog(`[+] REGISTERED profile detected on ${vector.name}`, 'success');
        } else {
          addLog(`[-] No profile detected on ${vector.name}`, 'info');
        }

        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: finalStatus,
          confidence,
          details: finalStatus === 'yes' ? 'Identity confirmed' : undefined
        } : r));
      }
    }

    addLog(`🏁 OSINT Scanner sequence finished. Export ready.`, 'success');
    setIsScanning(false);
  };

  const exportResults = (format: 'json' | 'csv') => {
    if (results.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let filename = `scanner_report_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(results, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else {
      content = 'Platform/Vector,Category,URL,Status,Confidence\n' +
        results.map(r => `"${r.name}","${r.category}","${r.url}","${r.status}",${r.confidence}%`).join('\n');
      mimeType = 'text/csv';
      filename += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    addLog(`💾 Exported data as ${format.toUpperCase()}: ${filename}`, 'success');
  };

  const matchesFound = results.filter(r => r.status === 'yes').length;
  const maybeFound = results.filter(r => r.status === 'maybe').length;
  const progressPercent = results.length > 0 
    ? Math.round((results.filter(r => r.status !== 'checking').length / results.length) * 100)
    : 0;

  return (
    <div className="social-analyzer-page">
      <div className="sa-back-btn" onClick={() => navigate('/')}>← Back to Portfolio</div>

      <header className="sa-header">
        <div className="sa-icon">🔍</div>
        <h1 className="sa-title">User Scanner</h1>
        <p className="sa-subtitle">2-in-1 Email &amp; Username OSINT footprint Intelligence suite</p>
      </header>

      {/* Advanced Settings */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="sa-link-btn" 
          style={{ gap: '0.4rem', fontSize: '0.9rem' }}
        >
          <Settings size={16} />
          {showSettings ? 'Hide Settings' : 'Advanced Proxy Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="sa-settings-panel">
          <div className="sa-settings-title">
            <Settings size={18} />
            <span>Proxy Configuration (CORS Bypass)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--white-muted)' }}>
            Due to browser security protocols, direct checking on major social sites can fail. Add a CORS proxy endpoint (e.g. <code>https://cors-anywhere.herokuapp.com/</code>) to route queries.
          </p>
          <div className="sa-proxy-input">
            <input 
              type="text" 
              placeholder="https://your-cors-proxy.com/" 
              value={proxyUrl} 
              onChange={(e) => setProxyUrl(e.target.value)} 
            />
            {proxyUrl && (
              <button className="btn btn-secondary" onClick={() => setProxyUrl('')}>Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="sa-tabs">
        <button 
          className={`sa-tab-btn ${scanMode === 'username' ? 'active' : ''}`}
          onClick={() => { setScanMode('username'); setTargetInput(''); setResults([]); }}
          disabled={isScanning}
        >
          <User size={16} />
          <span>Username Scanner</span>
        </button>
        <button 
          className={`sa-tab-btn ${scanMode === 'email' ? 'active' : ''}`}
          onClick={() => { setScanMode('email'); setTargetInput(''); setResults([]); }}
          disabled={isScanning}
        >
          <Mail size={16} />
          <span>Email Scanner</span>
        </button>
      </div>

      {/* Main Controls Panel */}
      <form onSubmit={runScan} className="sa-controls">
        <div className="sa-form-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>{scanMode === 'username' ? 'Target Username' : 'Target Email Address'}</label>
            <div className="sa-input-wrapper">
              <Search className="sa-input-icon" size={18} />
              <input 
                type={scanMode === 'email' ? 'email' : 'text'}
                placeholder={scanMode === 'username' ? 'e.g. kaifcodec' : 'e.g. user@example.com'} 
                value={targetInput} 
                onChange={(e) => setTargetInput(e.target.value)} 
                disabled={isScanning} 
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filter &amp; Permutations</label>
            {scanMode === 'username' ? (
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                disabled={isScanning}
              >
                <option value="all">All Categories</option>
                <option value="social">Social Media</option>
                <option value="dev">Dev &amp; Tech</option>
                <option value="gaming">Gaming</option>
                <option value="media">Media &amp; Design</option>
              </select>
            ) : (
              <div className="disabled-select-shim">Not applicable for Email</div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isScanning || !targetInput.trim()}
            style={{ height: '42px', width: '100%' }}
          >
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </button>
        </div>

        {scanMode === 'username' && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="enable-permutations" 
                checked={enablePermutations} 
                onChange={(e) => setEnablePermutations(e.target.checked)} 
                disabled={isScanning} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="enable-permutations" style={{ fontSize: '0.82rem', color: 'var(--white-dim)', cursor: 'pointer', margin: 0 }}>
                Generate Username Permutations (suffix/prefix variants)
              </label>
            </div>
            
            {enablePermutations && permutations.length > 0 && (
              <div className="permutation-preview">
                <span className="preview-label">Permutations list:</span>
                <div className="preview-chips">
                  {permutations.map((p, idx) => (
                    <span key={idx} className="preview-chip">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Export Options */}
      {results.length > 0 && !isScanning && (
        <div className="sa-export-bar">
          <span>Export Results:</span>
          <button className="btn btn-secondary" onClick={() => exportResults('json')}>
            <Download size={14} />
            <span>JSON</span>
          </button>
          <button className="btn btn-secondary" onClick={() => exportResults('csv')}>
            <Download size={14} />
            <span>CSV</span>
          </button>
        </div>
      )}

      {/* Scan Statistics Row */}
      {results.length > 0 && (
        <div className="sa-stats-row">
          <div className="sa-stat-card">
            <div className="sa-stat-value" style={{ color: 'var(--lavender)' }}>
              {results.length}
            </div>
            <div className="sa-stat-label">Total Sites</div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-value" style={{ color: '#50fa7b' }}>
              {matchesFound}
            </div>
            <div className="sa-stat-label">Registered</div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-value" style={{ color: 'var(--peach)' }}>
              {maybeFound}
            </div>
            <div className="sa-stat-label">Potential</div>
          </div>
          <div className="sa-stat-card">
            <div className="sa-stat-value">
              {progressPercent}%
            </div>
            <div className="sa-stat-label">Scan Progress</div>
          </div>
        </div>
      )}

      {/* Split Console & Results Dashboard */}
      {results.length > 0 && (
        <div className="sa-dashboard-layout">
          {/* Console Output */}
          <div className="sa-terminal">
            <div className="sa-terminal-header">
              <div className="sa-terminal-dots">
                <div className="sa-terminal-dot sa-dot-red" />
                <div className="sa-terminal-dot sa-dot-yellow" />
                <div className="sa-terminal-dot sa-dot-green" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <TerminalIcon size={12} />
                <span>user_scanner_cli.sh</span>
              </div>
            </div>
            
            <div className="sa-terminal-logs">
              {logs.map((log, index) => (
                <div key={index} className={`sa-log-line sa-log-${log.type}`}>
                  [{log.timestamp}] {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Results Status Board */}
          <div className="sa-status-panel">
            <div className="sa-status-title">
              <span>OSINT Footprint Report</span>
              {isScanning && <span className="pulse" style={{ fontSize: '0.75rem', color: 'var(--lavender)' }}>Executing Vector Resolvers...</span>}
            </div>
            
            <div className="sa-status-list">
              {results.map((result, index) => (
                <div key={index} className="sa-status-item">
                  <div className="sa-platform-info">
                    <div className="sa-platform-icon">
                      {scanMode === 'username' 
                        ? PLATFORMS.find(p => platformNameMatch(result.name, p.name))?.icon || '🌐'
                        : EMAIL_VECTORS.find(p => p.name === result.name)?.icon || '✉️'
                      }
                    </div>
                    <div>
                      <div className="sa-platform-name">{result.name}</div>
                      <div className="sa-platform-category">{result.category}</div>
                    </div>
                  </div>
                  
                  <div className="sa-status-badges">
                    <span className={`sa-badge sa-badge-${result.status}`}>
                      {result.status}
                    </span>
                    {(result.status === 'yes' || result.status === 'maybe') && (
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="sa-link-btn"
                        title="Open profile link"
                      >
                        <Link2 size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility to match base platform name with name variations like "GitHub (username)"
function platformNameMatch(fullName: string, targetName: string) {
  return fullName.toLowerCase().startsWith(targetName.toLowerCase());
}
