/* Banques de mots — la rejouabilité vient d'ici. ~580 entrées réparties par classe d'ennemi. */
'use strict';

const WORDS = {
  // Zombies-bugs de base : jargon dev court et rythmé
  keywords: [
    'git', 'npm', 'sudo', 'bash', 'node', 'java', 'rust', 'perl', 'ruby', 'scala',
    'kotlin', 'swift', 'python', 'golang', 'async', 'await', 'mutex', 'thread', 'kernel',
    'docker', 'kafka', 'redis', 'nginx', 'linux', 'debian', 'vim', 'emacs', 'regex',
    'lambda', 'closure', 'promise', 'callback', 'webpack', 'vite', 'babel', 'eslint',
    'deploy', 'rollback', 'commit', 'push', 'pull', 'merge', 'rebase', 'stash', 'branch',
    'fork', 'clone', 'hotfix', 'sprint', 'scrum', 'agile', 'kanban', 'devops', 'cloud',
    'api', 'jwt', 'cors', 'http', 'https', 'tcp', 'udp', 'dns', 'ssl', 'ssh',
    'yaml', 'json', 'xml', 'sql', 'nosql', 'crud', 'rest', 'graphql', 'grpc', 'oauth',
    'cron', 'daemon', 'shell', 'alias', 'chmod', 'chown', 'grep', 'awk', 'sed', 'curl',
    'wget', 'ping', 'htop', 'kill', 'pipe', 'stdin', 'stdout', 'stderr', 'heap', 'stack',
    'cache', 'proxy', 'queue', 'pubsub', 'shard', 'index', 'schema', 'tuple', 'enum',
    'struct', 'class', 'trait', 'mixin', 'monad', 'functor', 'memo', 'hash', 'salt',
    'bcrypt', 'token', 'cookie', 'session', 'socket', 'buffer', 'stream', 'chunk',
    'byte', 'float', 'double', 'bigint', 'null', 'void', 'static', 'final', 'public',
    'private', 'return', 'throw', 'catch', 'finally', 'yield', 'spread', 'polyfill',
    'shim', 'linter', 'minify', 'bundler', 'monorepo', 'pnpm', 'yarn', 'deno', 'bun',
    'tmux', 'zsh', 'brew', 'apt', 'pacman', 'systemd', 'selinux', 'iptables', 'vpn',
    'ipv6', 'cidr', 'subnet', 'webhook', 'sdk', 'cli', 'gui', 'tui', 'ide', 'repl',
    // — extension —
    'react', 'vue', 'svelte', 'angular', 'nextjs', 'nuxt', 'astro', 'remix', 'qwik',
    'spring', 'quarkus', 'django', 'flask', 'fastapi', 'rails', 'laravel', 'symfony',
    'phaser', 'unity', 'godot', 'blender', 'figma', 'jira', 'github', 'gitlab',
    'jenkins', 'argocd', 'helm', 'istio', 'envoy', 'consul', 'vault', 'packer',
    'grafana', 'kibana', 'splunk', 'sentry', 'datadog', 'sonar', 'swagger', 'postman',
    'mongo', 'postgres', 'mysql', 'mariadb', 'sqlite', 'oracle', 'duckdb', 'neo4j',
    'rabbitmq', 'pulsar', 'flink', 'spark', 'hadoop', 'airflow', 'dbt', 'etl',
    'pytorch', 'pandas', 'numpy', 'jupyter', 'mistral', 'claude', 'gpt', 'llm',
    'rag', 'finetune', 'prompt', 'agent', 'mcp', 'genai', 'opencv', 'cuda',
    'wasm', 'webgl', 'webrtc', 'pwa', 'spa', 'ssr', 'csr', 'seo', 'cdn', 'dom',
    'shadow', 'canvas', 'svg', 'flexbox', 'tailwind', 'sass', 'less', 'vitest',
    'jest', 'cypress', 'selenium', 'mockito', 'junit', 'tdd', 'bdd', 'ddd', 'cqrs',
    'saga', 'actor', 'pattern', 'facade', 'builder', 'visitor', 'observer', 'proxy',
    'segfault', 'coredump', 'strace', 'gdb', 'valgrind', 'perf', 'flamegraph',
    'opcode', 'bytecode', 'jit', 'gc', 'arena', 'pointer', 'malloc', 'free',
    'inline', 'macro', 'pragma', 'cmake', 'gradle', 'maven', 'cargo', 'pip',
    'venv', 'conda', 'nvm', 'sdkman', 'chocolatey', 'winget', 'ansible', 'puppet',
    'vagrant', 'qemu', 'libvirt', 'wsl', 'alpine', 'ubuntu', 'fedora', 'arch',
    'nixos', 'flatpak', 'snap', 'rsync', 'scp', 'netcat', 'nmap', 'tcpdump',
    'wireshark', 'mtls', 'sso', 'mfa', 'totp', 'pgp', 'aes', 'rsa', 'sha256',
    'base64', 'unicode', 'utf8', 'ascii', 'endian', 'bitwise', 'xor', 'modulo',
    'recursion', 'bigO', 'quicksort', 'btree', 'trie', 'graphe', 'dijkstra',
    'backtrack', 'greedy', 'memoize', 'currying', 'thunk', 'effect', 'signal',
    'store', 'reducer', 'selector', 'hook', 'props', 'state', 'context', 'portal',
    // — extension 2 —
    'zig', 'elixir', 'erlang', 'haskell', 'ocaml', 'clojure', 'htmx', 'preact',
    'solidjs', 'electron', 'tauri', 'flutter', 'dart', 'redux', 'zustand',
    'prisma', 'supabase', 'firebase', 'vercel', 'netlify', 'terraform', 'pulumi',
    'minikube', 'k9s', 'podman', 'traefik', 'caddy', 'keycloak', 'stripe',
    'turbo', 'biome', 'prettier', 'husky', 'semver', 'changelog', 'dotfiles',
    'neovim', 'lazygit', 'starship', 'ohmyzsh', 'fzf', 'ripgrep', 'jq', 'yq',
    'httpie', 'ngrok', 'localhost', 'boilerplate', 'refactor', 'rubber duck',
    'yak shaving', 'bikeshed', 'cargo cult', 'feature flag', 'dark launch',
  ],

  // Bugs d'élite : exceptions CamelCase (les majuscules font partie du challenge)
  exceptions: [
    'NullPointerException', 'SegFault', 'StackOverflow', 'RaceCondition', 'MemoryLeak',
    'OffByOneError', 'DeadLock', 'InfiniteLoop', 'HeisenBug', 'CorsError', 'Error418',
    'TimeoutException', 'OutOfMemory', 'DivideByZero', 'TypeError', 'SyntaxError',
    'ReferenceError', 'KernelPanic', 'BlueScreen', 'NaNaNaN', 'BufferOverflow',
    'UseAfterFree', 'DanglingPointer', 'ZombieProcess', 'OrphanProcess', 'ForkBomb',
    'CacheMiss', 'Error500', 'Error404', 'Error503', 'SchrodingBug', 'WontFix',
    'CannotReproduce', 'WorksOnMyMachine', 'FloatingPointHell', 'CharsetMojibake',
    'YamlIndentError', 'MergeConflict', 'CircularDependency', 'PromiseRejected',
    // — extension —
    'ClassCastException', 'IndexOutOfBounds', 'ConcurrentModification',
    'IllegalStateException', 'NoSuchElement', 'UnsupportedOperation',
    'NumberFormatException', 'ArithmeticOverflow', 'IntegerUnderflow',
    'UnhandledRejection', 'MaximumCallStack', 'CannotReadUndefined',
    'IsNotAFunction', 'UnexpectedToken', 'ModuleNotFound', 'PeerDepConflict',
    'ENOENT', 'EADDRINUSE', 'ECONNREFUSED', 'ETIMEDOUT', 'EACCES', 'EPERM',
    'OOMKilled', 'CrashLoopBackOff', 'ImagePullBackOff', 'PodEvicted',
    'CertificateExpired', 'TokenExpired', 'QuotaExceeded', 'RateLimited',
    'FlakyTest', 'BrokenPipe', 'PanicInProd', 'DataRace', 'LostUpdate',
    'PhantomRead', 'DirtyRead', 'SplitBrain', 'ThunderingHerd', 'CascadingFailure',
    'BitFlip', 'ClockSkew', 'LeapSecondBug', 'Y2K38Problem', 'TimezoneHell',
    'UnicodeNightmare', 'EncodingMismatch', 'LocaleSurprise', 'FloatEquality',
    // — extension 2 —
    'BusFactorZero', 'SilentFailure', 'HeapCorruption', 'StaleCache',
    'CacheStampede', 'ZombieThread', 'LivelockDetected', 'PriorityInversion',
    'FalseSharing', 'UndefinedBehavior', 'NullDereference', 'PoolExhausted',
    'TooManyOpenFiles', 'DiskFull', 'InodeExhausted', 'SSLHandshakeFailed',
    'PreflightFailed', 'CSRFMismatch', 'XSSDetected', 'SQLInjection',
    'PathTraversal', 'PrototypePollution', 'RegexDoS', 'BillionLaughs',
    'OffByTwoError', 'CopyPasteBug', 'MidnightDeploy', 'FridayCommit',
  ],

  // Zombies legacy : snippets de code + technos qui refusent de mourir
  snippets: [
    'const x = 42;', 'let i = 0;', 'if (err) throw err;', 'arr.map(x => x * 2)',
    'await fetch(url)', 'console.log("ok")', 'print("hello")', 'SELECT * FROM users;',
    'DROP TABLE prod;', 'import os', 'def main():', 'fn main()', 'public static void',
    'try risky()', 'catch (e)', 'return true;', 'x !== undefined',
    'a === b ? 1 : 0', 'for (;;)', 'while (true) break;', 'new Set(arr)',
    'JSON.parse(data)', 'Object.keys(obj)', 'setTimeout(fn, 0)', '#!/bin/bash',
    '<div id="app">', ':wq', 'display: flex;', 'margin: 0 auto;', '!important',
    'SELECT COUNT(*)', 'WHERE id = ?;', '@Override', '@Deprecated', 'lambda x: x + 1',
    'match self', 'Ok(())', 'unwrap()', 'panic!("oups")', 'TODO: fix later',
    '// ne pas toucher', 'git blame', 'sleep(3000)', 'rm -f *.log', 'z-index: 99999;',
    'if (true)', 'catch (Exception e)', 'npm audit fix', 'eval(input)',
    'document.write()', 'GOTO 10', 'ON ERROR RESUME', 'float: left;', '<table border=1>',
    '<marquee>promo</marquee>', '<blink>new</blink>', 'var that = this;',
    // — extension —
    'x ?? "defaut"', 'obj?.deep?.value', 'a ||= b;', 'i ??= 0;', 'n >>> 1',
    'Number("0x42")', 'NaN !== NaN', '0.1 + 0.2', 'typeof NaN', 'null == undefined',
    'use strict;', 'export default fn', 'import useState', 'async function* gen()',
    'new Proxy(obj)', 'Symbol.iterator', 'structuredClone(o)', 'Array.from(arr, fn)',
    'INNER JOIN orders o', 'GROUP BY user_id', 'HAVING COUNT(*) > 1', 'ORDER BY 1 DESC',
    'BEGIN TRANSACTION;', 'COMMIT;', 'ROLLBACK;', 'EXPLAIN ANALYZE', 'VACUUM FULL;',
    'CREATE INDEX idx ON t(c)', 'ALTER TABLE ADD COLUMN', 'ON CONFLICT DO NOTHING',
    'if __name__ == "__main__":', 'with open(f) as fp:', 'self.__dict__', 'yield from gen()',
    '@dataclass', '@lru_cache', 'raise ValueError(msg)', 'except KeyError:',
    'assert x is not None', 'List<Map<String, ?>>', 'Optional.ofNullable(x)',
    'stream().filter(p)', '.collect(toList())', 'synchronized (lock)',
    'volatile boolean run;', 'impl Display for Foo', 'Box<dyn Error>', 'Rc<RefCell<T>>',
    "lifetime <'a>", 'match Some(x) =>', '.unwrap_or_default()', '?Sized',
    'go func() ch <- 1', 'defer conn.Close()', 'if err != nil', 'chan struct',
    'interface partout', 'grid-template-areas', 'aspect-ratio: 16/9;',
    'transform: scale(1.1);', '@media (max-width:', ':has(> .error)', 'gap: 1rem;',
    'position: sticky;', 'overflow: hidden;', 'will-change: auto;', 'content: "";',
    'docker run -it --rm', 'FROM scratch', 'COPY . .', 'EXPOSE 8080', 'CMD node',
    'HEALTHCHECK CMD curl', 'replicas: 3', 'imagePullPolicy: Always', 'kind: Deployment',
    'apiVersion: apps/v1', 'livenessProbe:', 'kubectl apply -f .',
    // — extension 2 —
    'console.table(rows)', 'process.exit(1)', 'Promise.allSettled(ps)',
    'queueMicrotask(fn)', 'localStorage.clear()', 'IntersectionObserver',
    'WITH cte AS (SELECT 1)', 'COALESCE(a, b, 0)', 'LIMIT 10 OFFSET 90',
    'pip install -r req.txt', 'async with session:', '@lru_cache(None)',
    'derive(Debug)', 'let mut acc = 0;', 'tokio::spawn(async)',
    'sync.WaitGroup', 'errors.Is(err, io.EOF)', 'set -euo pipefail',
    'trap cleanup EXIT', '2>&1 | tee log.txt', '$(date +%F)',
  ],
  legacyNames: [
    'cobol', 'fortran', 'pascal', 'delphi', 'vb6', 'flash', 'silverlight', 'ie6',
    'jquery', 'xslt', 'soap', 'corba', 'struts', 'jsp', 'applet', 'activex',
    'frontpage', 'dreamweaver', 'windev', 'merise', 'cvs', 'svn', 'clearcase',
    'lotus notes', 'minitel', 'as400', 'mainframe', 'php4', 'ejb2', 'coldfusion',
    'webforms', 'wap', 'realplayer', 'shockwave', 'cgi-bin', 'fax serveur',
    // — extension —
    'algol', 'ada', 'lisp machine', 'smalltalk', 'turbo pascal', 'qbasic', 'logo',
    'hypercard', 'msdos', 'win31', 'winnt4', 'os/2', 'netware', 'token ring',
    'rs232', 'modem 56k', 'irda', 'zip drive', 'disquette', 'cdrom 2x', 'sgbd hier',
    'edifact', 'x25', 'transpac', 'bal x400', 'usenet', 'gopher', 'mosaic',
    'netscape 4', 'hotjava', 'vbscript', 'jscript', 'dhtml', 'framesets',
    'imagemap', 'webring', 'compteur gif', 'sous msn', 'caramail', 'multimania',
    // — extension 2 —
    'powerbuilder', 'crystal reports', 'access 97', 'windows me', 'zune',
    'palm pilot', 'blackberry', 'geocities', 'altavista', 'lycos', 'kazaa',
    'napster', 'winamp', 'clippy', 'msn messenger', 'icq', 'myspace', 'skyblog',
    'python 2', 'php5 en prod', 'angularjs', 'bower', 'grunt', 'coffeescript',
    'spacer gif', 'comic sans',
  ],

  // Faucheuses deadline : l'horreur du quotidien (rapides !)
  deadlines: [
    'daily standup', 'deadline', 'jira-1337', 'rgpd', 'audit', 'budget',
    'reporting', 'kpi', 'okr', 'roadmap', 'backlog', 'demo client', 'go nogo',
    'chiffrage', 'spec floue', 'mail urgent', 'ticket p1', 'asap', 'call 8h30',
    'slides', 'powerpoint', 'excel', 'macro vba', 'visio 17h45', 'point sync',
    'workshop', 'brainstorm', 'team building', 'n+1', 'copil', 'comex', 'rex',
    'poc jetable', 'v2 bientot', 'feature freeze', 'mep vendredi', 'astreinte',
    'reunionite', 'avenant', 'jira-404', 'jira-9999', 'retro sprint', 'capacity',
    'velocite', 'burndown', 'timesheet', 'imputation', 'cra', 'on-call',
    // — extension —
    'quick win', 'low hanging', 'best effort', 'as designed', 'by design',
    'hors scope', 'hors budget', 'hors delai', 'effet tunnel', 'serpent de mer',
    'usine a gaz', 'plat de spaghetti', 'dette technique', 'quick and dirty',
    'rustine', 'verrue', 'contournement', 'workaround', 'process', 'gouvernance',
    'comitologie', 'arbitrage', 'priorisation', 'matrice raci', 'orga cible',
    'transfo agile', 'safe', 'pi planning', 'value stream', 'feature team',
    'squad', 'tribu', 'chapter', 'guilde', 'mco', 'run', 'build vs run',
    'tma', 'forfait', 'regie', 'jour homme', 'staffing', 'intercontrat',
    'avant vente', 'soutenance', 'shortlist', 'benchmark', 'poc battle',
    'audit secu', 'pentest 16h', 'certif iso', 'plan b', 'plan com',
    'slack a 2h', 'teams down', 'visio sans son', 'tu mes muet', 'on t entend pas',
    'partage ecran', 'cest pas moi', 'ca marchait hier', 'cest la faute au reseau',
    // — extension 2 —
    'note de cadrage', 'plan de charge', 'comite projet', 'refinement',
    'daily a rallonge', 'demo qui plante', 'wifi du client', 'badge oublie',
    'salle occupee', 'gel des changements', 'cloture comptable', 'ticket bloque',
    'escalade n3', 'comite de crise', 'war room', 'plan daction', 'points bloquants',
  ],

  // Boss : commandes terminal complètes
  commands: [
    'git push --force', 'git rebase -i HEAD~3', 'docker compose up -d',
    'kubectl get pods -A', 'rm -rf node_modules', 'npm ci && npm run build',
    'chmod +x deploy.sh', 'tail -f /var/log/prod.log', 'ssh root@prod-01',
    'systemctl restart nginx', 'git bisect start', 'docker system prune -f',
    'kubectl rollout undo deploy/api', 'pg_dump prod > backup.sql',
    'redis-cli flushall', 'terraform apply -auto-approve', 'ansible-playbook deploy.yml',
    'git revert HEAD --no-edit', 'curl -X POST /api/fix', 'make clean && make',
    'cargo build --release', 'mvn clean install -DskipTests', 'sudo !!',
    'kill -9 $(pgrep java)', 'history | grep ssh', 'export NODE_ENV=production',
    'git reflog --all', 'docker logs -f api --tail 100', 'nc -zv prod 5432',
    'openssl x509 -in cert.pem -noout', 'find / -name "*.bak" -delete',
    // — extension —
    'git cherry-pick abc123', 'git stash pop --index', 'git log --oneline --graph',
    'git commit --amend --no-edit', 'git clean -fdx', 'git worktree add ../fix',
    'docker exec -it db psql', 'docker build -t api:latest .', 'docker stats --no-stream',
    'kubectl describe pod api-0', 'kubectl logs -f api-0 -c init',
    'kubectl scale deploy api --replicas=0', 'helm upgrade --install api ./chart',
    'aws s3 sync ./dist s3://bucket', 'gcloud run deploy --source .',
    'az login --use-device-code', 'ssh -L 5432:db:5432 bastion',
    'scp dump.sql prod:/tmp/', 'rsync -avz --delete ./ prod:/app',
    'journalctl -u nginx --since "1h ago"', 'systemctl daemon-reload',
    'crontab -e # noooon', 'chmod 777 / # JAMAIS', 'dd if=/dev/zero of=/dev/sda',
    'top -o %MEM', 'lsof -i :8080', 'netstat -tulpn | grep LISTEN',
    'du -sh * | sort -h', 'df -h | grep -v tmpfs', 'free -m && uptime',
    'ps aux | grep node | awk', 'xargs kill -9', 'watch -n1 kubectl get po',
    'sed -i "s/http/https/g" *.conf', 'cut -d: -f1 access.log',
    'sort access.log | uniq -c', 'tar -czvf backup.tgz /data',
    'python3 -m http.server 8000', 'npx kill-port 3000', 'yes | head -1000000',
  ],

  // Le RECRUTEUR : ennemi spammeur, et ses "missiles" InMail à abattre
  spammers: [
    'recruteur linkedin', 'chasseur de tetes', 'esn en chasse', 'staffing urgent',
    'business developer', 'talent acquisition', 'sourceur fou', 'cabinet rh',
  ],
  missiles: [
    'cv ?', 'dispo ?', 'ping', 'inmail', 'connect', 'tjm ?', 'urgent !',
    'job de reve', 're: re: cv', 'opportunite', 'hello !!', 'un appel ?',
    '5 min ?', 'mon reseau', 'profil top', 'come back',
    // — extension 2 —
    'top profil', 'match !', 'offre en or', 'full remote ?', 'relance',
    'relance 2', 'derniere chance', 'exclu !', 'process rapide', 'call demain ?',
  ],

  // MODE GINÈS : insultes geek, gentiment grossières (ça reste un stand)
  insults: [
    'espece de bug', 'tete de null', 'sac a spaghetti', 'mange disquette',
    'cerveau monothread', 'casseur de build', 'face de captcha',
    'cervelle en ram', 'gros tas de legacy', 'abruti du cloud',
    'commit sans message', 'testeur en prod', 'adorateur de excel',
    'sombre cretin de jquery', 'bouffeur de cookies', 'troll de forum',
    'naze du terminal', 'pompeur de stackoverflow', 'craneur en vim',
    'roi du copier coller', 'grosse quiche en bash', 'moule a merge',
    'bug sur pattes', 'pixel de travers', 'div mal centree',
    'point virgule oublie', 'tab contre espaces', 'windows vista',
    'imprimante du diable', 'modem dans ta tete', 'deployeur du vendredi',
    'gobelin du backlog', 'merge conflict ambulant', 'boulet du daily',
    'pilleur de npm', 'tocard en regex', 'brele en css', 'andouille de dev',
    'pauvre tache en sql', 'bras casse du clavier', 'gland du kanban',
    'patate en python', 'cornichon du cluster', 'sombre nullite',
  ],

  // L'INDÉP (niv.3) : la vie de freelance
  freelance: [
    'tjm a negocier', 'dispo en mars', 'freelance', 'portage salarial',
    'urssaf', 'facture impayee', 'mission courte', 'full remote sinon rien',
    'pas de cdi merci', 'micro entreprise', 'kbis', 'acompte de moitie',
    'mon reseau suffit', 'cumul de missions', 'relance facture', 'intercontrat jamais',
  ],

  // LE PO INSPIRÉ (niv.5) : ses idées foireuses, à taper…
  poIdeas: [
    'on pivote', 'comme uber', 'de la blockchain', 'avec de l ia',
    'juste un bouton', 'cest facile non', 'pour hier', 'mvp direct en prod',
    'les users adorent', 'ca prend 5 min', 'on verra en prod',
    'pas besoin de tests', 'comme tiktok', 'un petit chatbot', 'gamifions tout',
  ],
  // …et les rallonges qu'il greffe aux mots des autres (scope creep)
  scopeCreep: [' v2', ' v3', ' bis', ' rgpd', ' mobile', ' offline', ' dark mode', ' en mieux'],

  // L'OBFUSCATEUR (niv.4) : le jargon du code illisible
  obfuscation: [
    'minified', 'uglify', 'sourcemap', 'tree shaking', 'dead code',
    'spaghetti code', 'eval', 'rot13', 'magic number', 'no comment',
    'undocumented', 'write only', 'opaque', 'side effect', 'global state',
    'var x2', 'tmp final', 'foo bar baz', 'wtf per minute', 'here be dragons',
  ],

  // LE CONSULTANT (niv.4) : buzzwords de cabinet de conseil
  buzzwords: [
    'synergie', 'disruption', 'uberisation', 'transformation digitale',
    'conduite du changement', 'time to market', 'mindset agile',
    'proposition de valeur', 'business case', 'quick wins', 'best practices',
    'paradigm shift', 'thought leader', 'matrice swot', 'feuille de route',
    'alignement strategique', 'montee en competence', 'pool de ressources',
    'vision 360', 'cost killing', 'lean six sigma', 'top management',
    'deep dive', 'core business', 'growth hacking', 'scalabilite',
  ],

  // Power-ups (libellés fixes, dorés)
  powerups: {
    slowmo: 'coffee',
    knockback: 'git revert',
    nuke: 'sudo reboot',
  },

  /* Variantes anglaises des banques très françaises — les autres banques
     (jargon, commandes, code) sont communes aux deux langues. */
  en: {
    deadlines: [
      'daily standup', 'deadline', 'jira-1337', 'gdpr', 'audit', 'budget',
      'reporting', 'kpi', 'okr', 'roadmap', 'backlog', 'client demo', 'go nogo',
      'estimate', 'vague spec', 'urgent email', 'p1 ticket', 'asap', '8am call',
      'slides', 'powerpoint', 'excel', 'vba macro', '5pm meeting', 'sync point',
      'workshop', 'brainstorm', 'team building', 'steering co', 'exec board',
      'retro', 'timesheet', 'on-call', 'quick win', 'low hanging fruit',
      'best effort', 'as designed', 'out of scope', 'over budget', 'tech debt',
      'quick and dirty', 'workaround', 'process', 'governance', 'alignment',
      'raci matrix', 'agile transfo', 'pi planning', 'feature team', 'squad',
      'tribe', 'chapter', 'guild', 'staffing', 'pre sales', 'benchmark',
      'security audit', 'pentest at 4pm', 'plan b', 'teams down', 'you are muted',
      'cant hear you', 'screen share', 'not my fault', 'worked yesterday',
      'blame the network', 'war room', 'crisis meeting', 'change freeze',
    ],
    missiles: [
      'cv ?', 'open to work', 'ping', 'inmail', 'connect', 'rate ?', 'urgent !',
      'dream job', 're: re: cv', 'opportunity', 'hello !!', 'quick call ?',
      '5 min ?', 'my network', 'top profile', 'come back', 'last chance',
      'gold offer', 'full remote ?', 'follow up 2',
    ],
    spammers: [
      'linkedin recruiter', 'head hunter', 'agency hunting', 'urgent staffing',
      'business developer', 'talent acquisition', 'crazy sourcer', 'hr agency',
    ],
    insults: [
      'you absolute bug', 'null head', 'spaghetti bag', 'floppy muncher',
      'single thread brain', 'build breaker', 'captcha face',
      'ram for brains', 'fat legacy pile', 'cloud dumbass',
      'no message committer', 'tester in prod', 'excel worshipper',
      'jquery moron', 'cookie eater', 'forum troll', 'terminal numpty',
      'stackoverflow leech', 'vim show off', 'copy paste king',
      'useless bash muppet', 'merge conflict goblin', 'bug on legs',
      'crooked pixel', 'uncentered div', 'missing semicolon',
      'tabs vs spaces', 'windows vista', 'cursed printer', 'dialup brain',
      'friday deployer', 'backlog goblin', 'daily standup donkey',
      'npm looter', 'regex donut', 'css plonker', 'absolute dev dunce',
      'sql nitwit', 'keyboard wrecker', 'kanban knob', 'python potato',
      'cluster clown', 'utter nullity',
    ],
    freelance: [
      'rate negotiable', 'available in march', 'freelance', 'umbrella company',
      'unpaid invoice', 'short gig', 'full remote or nothing', 'no permanent contract',
      'my own boss', 'sole trader', 'upfront deposit', 'my network is enough',
      'stacking gigs', 'invoice reminder', 'never on the bench', 'side project',
    ],
    poIdeas: [
      'lets pivot', 'like uber', 'add blockchain', 'with some ai',
      'just one button', 'easy right', 'due yesterday', 'mvp straight to prod',
      'users love it', 'takes 5 min', 'we will see in prod',
      'no tests needed', 'like tiktok', 'a small chatbot', 'gamify everything',
    ],
    scopeCreep: [' v2', ' v3', ' gdpr', ' mobile', ' offline', ' dark mode', ' but better'],
    buzzwords: [
      'synergy', 'disruption', 'uberization', 'digital transformation',
      'change management', 'time to market', 'agile mindset', 'value proposition',
      'business case', 'quick wins', 'best practices', 'paradigm shift',
      'thought leader', 'swot matrix', 'roadmap alignment', 'upskilling',
      'resource pool', '360 vision', 'cost killing', 'lean six sigma',
      'c-level deep dive', 'core business', 'growth hacking', 'scalability',
    ],
  },
};

/* MODE GINÈS : la combinatoire fait l'abondance — on génère plusieurs
   centaines d'insultes supplémentaires (nom × domaine) dans chaque langue,
   plus les noms seuls en version courte pour la difficulté STAGIAIRE. */
(function expandInsults() {
  const frNouns = ['boulet', 'tocard', 'quiche', 'brele', 'andouille', 'gland',
    'naze', 'patate', 'cornichon', 'truffe', 'moule', 'banane', 'nouille',
    'courge', 'gourde', 'buse', 'cruche', 'manche', 'tanche', 'mollusque'];
  const frDomains = ['du cloud', 'du backlog', 'en regex', 'en css', 'du kanban',
    'en sql', 'du terminal', 'en python', 'du daily', 'des migrations',
    'du sprint', 'en yaml', 'du monorepo', 'en prod', 'du vendredi',
    'en typescript', 'du refacto', 'des reviews'];
  for (const n of frNouns) for (const d of frDomains) WORDS.insults.push(`${n} ${d}`);
  WORDS.insults.push(...frNouns);

  const enDomains = ['cloud', 'backlog', 'regex', 'css', 'kanban', 'sql',
    'terminal', 'python', 'standup', 'yaml', 'monorepo', 'prod', 'sprint',
    'docker', 'friday', 'refactor', 'review', 'typescript'];
  const enNouns = ['muppet', 'donut', 'numpty', 'plonker', 'dimwit', 'nitwit',
    'potato', 'clown', 'goblin', 'walnut', 'pickle', 'noodle', 'dunce',
    'turnip', 'wally', 'twit', 'doofus', 'lemon', 'gremlin', 'clod'];
  for (const d of enDomains) for (const n of enNouns) WORDS.en.insults.push(`${d} ${n}`);
  WORDS.en.insults.push(...enNouns);
})();

/* Banque éventuellement traduite : utilisée pour les banques qui ont une
   variante dans WORDS.en quand la langue n'est pas le français. */
function wordBank(name) {
  if (typeof LANG !== 'undefined' && LANG !== 'fr' && WORDS.en[name]) return WORDS.en[name];
  return WORDS[name];
}

/* Tire un mot au hasard dans une banque, en évitant les doublons à l'écran
   et en respectant une longueur max (selon la difficulté). */
function pickWord(bank, { maxLen = 99, exclude = new Set() } = {}) {
  const pool = bank.filter((w) => w.length <= maxLen && !exclude.has(w));
  const source = pool.length ? pool : bank;
  return source[Math.floor(Math.random() * source.length)];
}
