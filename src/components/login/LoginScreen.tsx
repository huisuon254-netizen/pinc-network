import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, RefreshCw, Eye, EyeOff, ArrowRight, Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Identity } from '../../types';
import LanguageSelector from '../language/LanguageSelector';
import RoleSelector from '../roles/RoleSelector';

type Mode = 'menu' | 'login' | 'signup' | 'confirm-seed' | 'recover';

const BIP39_WORDS = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
  'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','awesome','awful','awkward','axis','baby','bachelor','bacon','badge','bag',
  'balance','balcony','ball','bamboo','banana','banner','bar','barely','bargain','barrel',
  'base','basic','basket','battle','beach','bean','beauty','because','become','beef',
  'before','begin','behave','behind','believe','below','belt','bench','benefit','best',
  'betray','better','between','beyond','bicycle','bid','bike','bind','biology','bird',
  'birth','bitter','black','blade','blame','blanket','blast','bleak','bless','blind',
  'blood','blossom','blow','blue','blur','blush','board','boat','body','boil',
  'bomb','bone','bonus','book','boost','border','boring','borrow','boss','bottom',
  'bounce','box','boy','bracket','brain','brand','brass','brave','bread','breeze',
  'brick','bridge','brief','bright','bring','brisk','broccoli','broken','bronze','broom',
  'brother','brown','brush','bubble','buddy','budget','buffalo','build','bulb','bulk',
  'bullet','bundle','bunny','burden','burger','burst','bus','business','busy','butter',
  'buyer','buzz','cabbage','cabin','cable','cactus','cage','cake','call','calm',
  'camera','camp','can','canal','cancel','candy','cannon','canoe','canvas','canyon',
  'capable','capital','captain','car','carbon','card','cargo','carpet','carry','cart',
  'case','cash','casino','castle','casual','cat','catalog','catch','category','cattle',
  'caught','cause','caution','cave','ceiling','celery','cement','census','century','cereal',
  'certain','chair','chalk','champion','change','chaos','chapter','charge','chase','cheap',
  'check','cheese','chef','cherry','chest','chicken','chief','child','chimney','choice',
  'choose','chronic','chuckle','chunk','churn','citizen','city','civil','claim','clap',
  'clarify','claw','clay','clean','clerk','clever','cliff','climb','clinic','clip',
  'clock','clog','close','cloth','cloud','clown','club','clump','cluster','clutch',
  'coach','coast','coconut','code','coffee','coil','coin','collect','color','column',
  'combine','come','comfort','comic','common','company','concert','conduct','confirm','congress',
  'connect','consider','control','convince','cook','cool','copper','copy','coral','core',
  'corn','correct','cost','cotton','couch','country','couple','course','cousin','cover',
  'coyote','crack','cradle','craft','cram','crane','crash','crater','crawl','crazy',
  'cream','credit','creek','crew','cricket','crime','crisp','critic','crop','cross',
  'crouch','crowd','crucial','cruel','cruise','crumble','crush','cry','crystal','cube',
  'culture','cup','cupboard','curious','current','curtain','curve','cushion','custom','cute',
  'cycle','dad','damage','damp','dance','danger','daring','dash','daughter','dawn',
  'day','deal','debate','debris','decade','december','decide','decline','decorate','decrease',
  'deer','defense','define','defy','degree','delay','deliver','demand','demise','denial',
  'dentist','deny','depart','depend','deposit','depth','deputy','derive','describe','desert',
  'design','desk','despair','destroy','detail','detect','develop','device','devote','diagram',
  'dial','diamond','diary','dice','diesel','diet','differ','digital','dignity','dilemma',
  'dinner','dinosaur','direct','dirt','disagree','discover','disease','dish','dismiss','disorder',
  'display','distance','divert','divide','divorce','dizzy','doctor','document','dog','doll',
  'dolphin','domain','donate','donkey','donor','door','dose','double','dove','draft',
  'dragon','drama','drastic','draw','dream','dress','drift','drill','drink','drip',
  'drive','drop','drum','dry','duck','dumb','dune','during','dust','dutch',
  'duty','dwarf','dynamic','eager','eagle','early','earn','earth','easily','east',
  'easy','echo','ecology','economy','edge','edit','educate','effort','egg','eight',
  'either','elbow','elder','electric','elegant','element','elephant','elevator','elite','else',
  'embark','embody','embrace','emerge','emotion','employ','empower','empty','enable','enact',
  'end','endless','endorse','enemy','energy','enforce','engage','engine','enhance','enjoy',
  'enlist','enough','enrich','enroll','ensure','enter','entire','entry','envelope','episode',
  'equal','equip','era','erase','erode','erosion','error','erupt','escape','essay',
  'essence','estate','eternal','ethics','evidence','evil','evoke','evolve','exact','example',
  'excess','exchange','excite','exclude','excuse','execute','exercise','exhaust','exhibit','exile',
  'exist','exit','exotic','expand','expect','expire','explain','expose','express','extend',
  'extra','eye','eyebrow','fabric','face','faculty','fade','faint','faith','fall',
  'false','fame','family','famous','fan','fancy','fantasy','farm','fashion','fat',
  'fatal','father','fatigue','fault','favorite','feature','february','federal','fee','feed',
  'feel','female','fence','festival','fetch','fever','few','fiber','fiction','field',
  'figure','file','film','filter','final','find','fine','finger','finish','fire',
  'firm','fiscal','fish','fit','fitness','fix','flag','flame','flash','flat',
  'flavor','flee','flight','flip','float','flock','floor','flower','fluid','flush',
  'fly','foam','focus','fog','foil','fold','follow','food','foot','force',
  'forest','forget','fork','fortune','forum','forward','fossil','foster','found','fox',
  'fragile','frame','frequent','fresh','friend','fringe','frog','front','frost','frown',
  'frozen','fruit','fuel','fun','funny','furnace','fury','future','gadget','gain',
  'galaxy','gallery','game','gap','garage','garbage','garden','garlic','garment','gas',
  'gasp','gate','gather','gauge','gaze','general','genius','genre','gentle','genuine',
  'gesture','ghost','giant','gift','giggle','ginger','giraffe','girl','give','glad',
  'glance','glare','glass','glide','glimpse','globe','gloom','glory','glove','glow',
  'glue','goat','goddess','gold','good','goose','gorilla','gospel','gossip','govern',
  'gown','grab','grace','grain','grant','grape','grass','gravity','great','green',
  'grid','grief','grit','grocery','group','grow','grunt','guard','guess','guide',
  'guilt','guitar','gun','gym','habit','hair','half','hammer','hamster','hand',
  'happy','harbor','hard','harsh','harvest','hat','have','hawk','hazard','head',
  'health','heart','heavy','hedgehog','height','hello','helmet','help','hen','hero',
  'hip','hire','history','hobby','hockey','hold','hole','holiday','hollow','home',
  'honey','hood','hope','horn','horror','horse','hospital','host','hotel','hour',
  'hover','hub','huge','human','humble','humor','hundred','hungry','hunt','hurdle',
  'hurry','hurt','husband','hybrid','ice','icon','idea','identify','idle','ignore',
  'ill','illegal','illness','image','imitate','immense','immune','impact','impose','improve',
  'impulse','inch','include','income','increase','index','indicate','indoor','industry','infant',
  'inflict','inform','initial','inject','inmate','inner','innocent','input','inquiry','insane',
  'insect','inside','inspire','install','intact','interest','into','invest','invite','involve',
  'iron','island','isolate','issue','item','ivory','jacket','jaguar','jar','jazz',
  'jealous','jeans','jelly','jewel','job','join','joke','journey','joy','judge',
  'juice','jump','jungle','junior','junk','just','kangaroo','keen','keep','ketchup',
  'key','kick','kid','kidney','kind','kingdom','kiss','kit','kitchen','kite',
  'kitten','kiwi','knee','knife','knock','know','lab','label','labor','ladder',
  'lady','lake','lamp','language','laptop','large','later','latin','laugh','laundry',
  'lava','law','lawn','lawsuit','layer','lazy','leader','leaf','learn','leave',
  'lecture','left','leg','legal','legend','leisure','lemon','lend','length','lens',
  'leopard','lesson','letter','level','liberty','library','license','life','lift','light',
  'like','limb','limit','link','lion','liquid','list','little','live','lizard',
  'load','loan','lobster','local','lock','logic','lonely','long','loop','lottery',
  'loud','lounge','love','loyal','lucky','luggage','lumber','lunar','lunch','luxury',
  'lyrics','machine','mad','magic','magnet','maid','mail','main','major','make',
  'mammal','man','manage','mandate','mango','mansion','manual','maple','marble','march',
  'margin','marine','market','marriage','mask','mass','master','match','material','math',
  'matrix','matter','maximum','maze','meadow','mean','measure','meat','mechanic','medal',
  'media','melody','melt','member','memory','mention','menu','mercy','merge','merit',
  'merry','mesh','message','metal','method','middle','midnight','milk','million','mimic',
  'mind','minimum','minor','minute','miracle','mirror','misery','miss','mistake','mix',
  'mixed','mixture','mobile','model','modify','mom','moment','monitor','monkey','monster',
  'month','moon','moral','more','morning','mosquito','mother','motion','motor','mountain',
  'mouse','move','movie','much','muffin','mule','multiply','muscle','museum','mushroom',
  'music','must','mutual','myself','mystery','myth','naive','name','napkin','narrow',
  'nasty','nation','nature','near','neck','need','negative','neglect','neither','nephew',
  'nerve','nest','net','network','neutral','never','news','next','nice','night',
  'noble','noise','nominee','noodle','normal','north','nose','notable','nothing','notice',
  'novel','now','nuclear','number','nurse','nut','oak','obey','object','oblige',
  'obscure','observe','obtain','obvious','occur','ocean','october','odor','off','offer',
  'office','often','oil','okay','old','olive','olympic','omit','once','one',
  'onion','online','only','open','opera','opinion','oppose','option','orange','orbit',
  'orchard','order','ordinary','organ','orient','original','orphan','ostrich','other','outdoor',
  'outer','output','outside','oval','oven','over','own','owner','oxygen','oyster',
  'ozone','pact','paddle','page','pair','palace','palm','panda','panel','panic',
  'panther','paper','parade','parent','park','parrot','party','pass','patch','path',
  'patient','patrol','pattern','pause','pave','payment','peace','peanut','pear','peasant',
  'pelican','pen','penalty','pencil','people','pepper','perfect','permit','person','pet',
  'phone','photo','phrase','physical','piano','picnic','picture','piece','pig','pigeon',
  'pill','pilot','pink','pioneer','pipe','pistol','pitch','pizza','place','planet',
  'plastic','plate','play','please','pledge','pluck','plug','plunge','poem','poet',
  'point','polar','pole','police','pond','pony','pool','popular','portion','position',
  'possible','post','potato','pottery','poverty','powder','power','practice','praise','predict',
  'prefer','prepare','present','pretty','prevent','price','pride','primary','print','priority',
  'prison','private','prize','problem','process','produce','profit','program','project','promote',
  'proof','property','prosper','protect','proud','provide','public','pudding','pull','pulp',
  'pulse','pumpkin','punch','pupil','puppy','purchase','purity','purpose','purse','push',
  'put','puzzle','pyramid','quality','quantum','quarter','question','quick','quit','quiz',
  'quote','rabbit','raccoon','race','rack','radar','radio','rage','rail','rain',
  'raise','rally','ramp','ranch','random','range','rapid','rare','rate','rather',
  'raven','raw','razor','ready','real','reason','rebel','rebuild','recall','receive',
  'recipe','record','recycle','reduce','reflect','reform','region','regret','regular','reject',
  'relax','release','relief','rely','remain','remember','remind','remove','render','renew',
  'rent','reopen','repair','repeat','replace','report','require','rescue','resemble','resist',
  'resource','response','result','retire','retreat','return','reunion','reveal','review','reward',
  'rhythm','rib','ribbon','rice','rich','ride','ridge','rifle','right','rigid',
  'ring','riot','ripple','risk','ritual','rival','river','road','roast','robot',
  'robust','rocket','romance','roof','rookie','room','rose','rotate','rough','round',
  'route','royal','rubber','rude','rug','rule','run','runway','rural','sad',
  'saddle','sadness','safe','sail','salad','salmon','salon','salt','salute','same',
  'sample','sand','satisfy','satoshi','sauce','sausage','save','say','scale','scan',
  'scare','scatter','scene','scheme','school','science','scissors','scorpion','scout','scrap',
  'screen','script','scrub','sea','search','season','seat','second','secret','section',
  'security','seed','seek','segment','select','sell','seminar','senior','sense','sentence',
  'series','service','session','settle','setup','seven','shadow','shaft','shallow','share',
  'shed','shell','sheriff','shield','shift','shine','ship','shiver','shock','shoe',
  'shoot','shop','short','shoulder','shove','shrimp','shrug','shuffle','shy','sibling',
  'sick','side','siege','sight','sign','silent','silk','silly','silver','similar',
  'simple','since','sing','siren','sister','situate','six','size','skate','sketch',
  'ski','skill','skin','skirt','skull','slab','slam','sleep','slender','slice',
  'slide','slight','slim','slogan','slot','slow','slush','small','smart','smile',
  'smoke','smooth','snack','snake','snap','sniff','snow','soap','soccer','social',
  'sock','soda','soft','solar','soldier','solid','solution','solve','someone','song',
  'soon','sorry','sort','soul','sound','soup','source','south','space','spare',
  'spatial','spawn','speak','special','speed','spell','spend','sphere','spice','spider',
  'spike','spin','spirit','split','sponsor','spoon','sport','spot','spray','spread',
  'spring','spy','square','squeeze','squirrel','stable','stadium','staff','stage','stairs',
  'stamp','stand','start','state','stay','steak','steel','stem','step','stereo',
  'stick','still','sting','stock','stomach','stone','stool','story','stove','strategy',
  'street','strike','strong','struggle','student','stuff','stumble','style','subject','submit',
  'subway','success','such','sudden','suffer','sugar','suggest','suit','summer','sun',
  'sunny','sunset','super','supply','supreme','sure','surface','surge','surprise','surround',
  'survey','suspect','sustain','swallow','swamp','swap','swarm','swear','sweet','swim',
  'swing','switch','sword','symbol','symptom','syrup','system','table','tackle','tag',
  'tail','talent','talk','tank','tape','target','task','taste','tattoo','taxi',
  'teach','team','tell','ten','tenant','tennis','tent','term','test','text',
  'thank','that','theme','then','theory','there','they','thing','this','thought',
  'three','thrive','throw','thumb','thunder','ticket','tide','tiger','tilt','timber',
  'time','tiny','tip','tired','tissue','title','toast','tobacco','today','toddler',
  'toe','together','toilet','token','tomato','tomorrow','tone','tongue','tonight','tool',
  'tooth','top','topic','topple','torch','tornado','tortoise','toss','total','tourist',
  'toward','tower','town','toy','track','trade','traffic','tragic','train','transfer',
  'trap','trash','travel','tray','treat','tree','trend','trial','tribe','trick',
  'trigger','trim','trip','trophy','trouble','truck','true','truly','trumpet','trust',
  'truth','try','tube','tuna','tunnel','turkey','turn','turtle','twelve','twenty',
  'twice','twin','twist','two','type','typical','ugly','umbrella','unable','unaware',
  'uncle','uncover','under','undo','unfair','unfold','unhappy','uniform','union','unique',
  'unit','universe','unknown','unlock','until','unusual','unveil','update','upgrade','uphold',
  'upon','upper','upset','urban','usage','use','used','useful','useless','usual',
  'utility','vacant','vacuum','vague','valid','valley','valve','van','vanish','vapor',
  'various','vast','vault','vehicle','velvet','vendor','venture','venue','verb','verify',
  'version','very','vessel','veteran','viable','vibrant','vicious','victory','video','view',
  'village','vintage','violin','virtual','virus','visa','visit','visual','vital','vivid',
  'vocal','voice','void','volcano','volume','vote','voyage','wage','wagon','wait',
  'walk','wall','walnut','want','warfare','warm','warrior','wash','wasp','waste',
  'water','wave','way','wealth','weapon','wear','weasel','weather','web','wedding',
  'weekend','weird','welcome','well','west','wet','whale','what','wheat','wheel',
  'when','where','whip','whisper','wide','width','wife','wild','will','win',
  'window','wine','wing','wink','winner','winter','wire','wisdom','wise','wish',
  'witness','wolf','woman','wonder','wood','wool','word','work','world','worry',
  'worth','wrap','wreck','wrestle','wrist','write','wrong','yard','year','yellow',
  'you','young','youth','zebra','zero','zone','zoo',
];

function generateSeedPhrase(wordCount = 12): string {
  const arr = new Uint32Array(wordCount);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => BIP39_WORDS[n % BIP39_WORDS.length]).join(' ');
}

export default function LoginScreen() {
  const { setScreen, setIdentity } = useAppStore();
  const [mode, setMode] = useState<Mode>('menu');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [phrase, setPhrase] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedCopied, setSeedCopied] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError('Username and password required'); return; }
    setLoading(true);
    setError(null);
    try {
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const hasIdentity = await invoke('cmd_has_identity');
        if (hasIdentity) {
          const id = await invoke('cmd_get_identity') as Identity;
          setIdentity(id);
        } else {
          setError('No identity found. Please sign up first.');
          setLoading(false);
          return;
        }
      }
      setScreen('dashboard');
    } catch (e: any) {
      setError(e?.toString() || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!password) { setError('Master key required'); return; }
    setLoading(true);
    setError(null);
    try {
      let identity: Identity;
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        identity = await invoke('cmd_create_identity', { masterKey: password, username: username || 'user' }) as Identity;
      } else {
        identity = {
          id: crypto.randomUUID(),
          node_id: String(Math.floor(Math.random() * 10000000)).padStart(7, '0'),
          username: username || 'user',
          public_key: crypto.randomUUID().replace(/-/g, ''),
          fingerprint: crypto.randomUUID(),
          recovery_hash: '',
          created_at: Date.now(),
        };
      }
      const seed = generateSeedPhrase();
      setGeneratedSeed(seed);
      setIdentity(identity);
      setMode('confirm-seed');
    } catch (e: any) {
      setError(e?.toString() || 'Signup failed');
    }
    setLoading(false);
  };

  const handleConfirmSeed = () => {
    setScreen('dashboard');
  };

  const handleRecover = async () => {
    if (!phrase || !masterKey) { setError('Recovery phrase and master key required'); return; }
    setLoading(true);
    setError(null);
    try {
      if (window.__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const identity = await invoke('cmd_recover_identity', { phrase, masterKey, username: username || 'user' }) as Identity;
        setIdentity(identity);
      }
      setScreen('dashboard');
    } catch (e: any) {
      setError(e?.toString() || 'Recovery failed');
    }
    setLoading(false);
  };

  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(generatedSeed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 2000);
    } catch {}
  };

  const resetAll = () => {
    setMode('menu');
    setError(null);
    setGeneratedSeed('');
    setSeedCopied(false);
    setPhrase('');
    setMasterKey('');
    setPassword('');
    setUsername('');
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'1rem' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:440, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'var(--accent)', fontFamily:'var(--font-display)' }}>PINC</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.75rem', letterSpacing:'0.15em' }}>PRIVATE INTELLIGENT NETWORK CORE</div>
        </div>

        {/* Menu Mode */}
        {mode === 'menu' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            <button className="pinc-btn pinc-btn-primary" onClick={() => setMode('login')} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Shield size={16} /> LOGIN
            </button>
            <button className="pinc-btn" onClick={() => setMode('signup')} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Key size={16} /> CREATE IDENTITY
            </button>
            <button className="pinc-btn" onClick={() => setMode('recover')} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <RefreshCw size={16} /> RECOVER
            </button>
            <div style={{ marginTop:'1rem' }}>
              <LanguageSelector />
            </div>
            <div style={{ marginTop:'0.5rem' }}>
              <RoleSelector />
            </div>
          </motion.div>
        )}

        {/* Login Mode */}
        {mode === 'login' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>USERNAME</label>
              <input className="pinc-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="enter username" />
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>PASSWORD</label>
              <div style={{ position:'relative' }}>
                <input className="pinc-input" type={showKey ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="enter password" style={{ paddingRight:40 }} />
                <button onClick={() => setShowKey(!showKey)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div style={{ color:'var(--accent-red)', fontSize:'0.8rem' }}>{error}</div>}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="pinc-btn" onClick={() => { resetAll(); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleLogin} disabled={loading} style={{ flex:2 }}>
                {loading ? 'LOGGING IN...' : 'LOGIN'} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Signup Mode */}
        {mode === 'signup' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ padding:'1rem', background:'var(--bg-secondary)', borderRadius:8, fontSize:'0.8rem', color:'var(--text-muted)' }}>
              Your identity will be encrypted with the master key. Choose a username and a strong master key. A seed phrase will be generated for recovery.
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>USERNAME</label>
              <input className="pinc-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="choose a username" />
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>MASTER KEY</label>
              <div style={{ position:'relative' }}>
                <input className="pinc-input" type={showKey ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="choose a strong master key" style={{ paddingRight:40 }} />
                <button onClick={() => setShowKey(!showKey)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div style={{ color:'var(--accent-red)', fontSize:'0.8rem' }}>{error}</div>}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="pinc-btn" onClick={() => { resetAll(); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleSignup} disabled={loading} style={{ flex:2 }}>
                {loading ? 'CREATING...' : 'CREATE IDENTITY'} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Confirm Seed Mode */}
        {mode === 'confirm-seed' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ padding:'1rem', background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:8, fontSize:'0.8rem', color:'var(--text-muted)' }}>
              Write down these 12 words in order and keep them safe. Anyone with this phrase can recover your identity. This phrase will not be shown again.
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>YOUR SEED PHRASE</label>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.4rem',
                padding:'1rem', background:'var(--bg-secondary)', borderRadius:8,
              }}>
                {generatedSeed.split(' ').map((word, i) => (
                  <div key={i} style={{
                    fontSize:'0.75rem', color:'var(--text-primary)',
                    padding:'0.4rem 0.5rem', background:'var(--bg-tertiary)',
                    borderRadius:4, textAlign:'center', fontFamily:'monospace',
                  }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.6rem', marginRight:'0.3rem' }}>{i + 1}.</span>
                    {word}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCopySeed}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem',
                  width:'100%', marginTop:'0.5rem', padding:'0.5rem',
                  background:'var(--bg-secondary)', border:'1px solid var(--border)',
                  borderRadius:6, color: seedCopied ? 'var(--accent)' : 'var(--text-muted)',
                  cursor:'pointer', fontSize:'0.7rem',
                }}
              >
                {seedCopied ? <Check size={14} /> : <Copy size={14} />}
                {seedCopied ? 'COPIED' : 'COPY TO CLIPBOARD'}
              </button>
            </div>
            {error && <div style={{ color:'var(--accent-red)', fontSize:'0.8rem' }}>{error}</div>}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="pinc-btn pinc-btn-primary" onClick={handleConfirmSeed} style={{ flex:1 }}>
                I SAVED MY SEED PHRASE <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Recover Mode */}
        {mode === 'recover' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>RECOVERY PHRASE</label>
              <textarea className="pinc-input" value={phrase} onChange={e => setPhrase(e.target.value)}
                placeholder="word1 word2 word3 ... word12" rows={4} style={{ resize:'vertical', lineHeight:1.7 }} />
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>USERNAME</label>
              <input className="pinc-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="enter your username" />
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>MASTER KEY</label>
              <input className="pinc-input" type={showKey ? 'text' : 'password'} value={masterKey}
                onChange={e => setMasterKey(e.target.value)} placeholder="enter your master key" />
            </div>
            {error && <div style={{ color:'var(--accent-red)', fontSize:'0.8rem' }}>{error}</div>}
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="pinc-btn" onClick={() => { resetAll(); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleRecover} disabled={loading} style={{ flex:2 }}>
                {loading ? 'RECOVERING...' : 'RECOVER IDENTITY'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
