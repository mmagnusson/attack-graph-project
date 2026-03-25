// ─── Technique Examples (Built-in Dataset) ────────────────────────────────────

export interface TechniqueExample {
  summary: string;
  examples: string[];
}

export interface Mitigation {
  mitreId: string;
  name: string;
}

export interface ChainProfile {
  country: string;
  aliases: string[];
  firstSeen: string;
  lastSeen: string;
  sectors: string[];
  description: string;
}

export const TECHNIQUE_EXAMPLES: Record<string, TechniqueExample> = {
  "T1595": {
    summary: "Adversaries scan victim IP ranges and infrastructure to identify potential entry points and running services.",
    examples: [
      "Port scanning external-facing hosts to find open management interfaces",
      "Banner grabbing web servers to identify vulnerable software versions",
      "DNS enumeration to map an organization's internet-facing attack surface",
    ],
  },
  "T1598": {
    summary: "Adversaries send targeted messages to elicit sensitive information like credentials or internal details before the actual attack.",
    examples: [
      "Spoofed emails impersonating IT support asking users to verify credentials",
      "Social media messages to employees asking about internal tools and processes",
      "Fake vendor surveys designed to gather technical environment details",
    ],
  },
  "T1592": {
    summary: "Adversaries collect information about victim hosts such as hardware, software, and configurations to tailor attacks.",
    examples: [
      "Scraping job postings that reveal internal technology stacks",
      "Using browser fingerprinting on watering-hole sites to profile visitor systems",
      "Harvesting exposed configuration files from misconfigured web servers",
    ],
  },
  "T1583": {
    summary: "Adversaries acquire infrastructure such as servers, domains, and cloud services to stage and execute operations.",
    examples: [
      "Registering look-alike domains for credential phishing campaigns",
      "Purchasing VPS hosting in multiple countries for C2 resilience",
      "Setting up cloud storage accounts for malware staging and exfiltration",
    ],
  },
  "T1588": {
    summary: "Adversaries obtain tools, exploits, and certificates to use during operations rather than developing them.",
    examples: [
      "Purchasing zero-day exploits from underground markets",
      "Downloading open-source offensive tools like Cobalt Strike or Mimikatz",
      "Stealing valid code-signing certificates to sign malware",
    ],
  },
  "T1586": {
    summary: "Adversaries compromise existing accounts on third-party services to use for targeting victims.",
    examples: [
      "Hijacking a trusted vendor's email account for supply-chain phishing",
      "Purchasing stolen corporate credentials from darknet markets",
      "Compromising social media accounts to distribute malicious links",
    ],
  },
  "T1566": {
    summary: "Adversaries send targeted emails with malicious attachments or links to gain initial access.",
    examples: [
      "Spearphishing with weaponized Office documents containing macros",
      "Credential harvesting via spoofed login pages linked in emails",
      "HTML smuggling attachments that drop malware when opened",
    ],
  },
  "T1190": {
    summary: "Adversaries exploit vulnerabilities in internet-facing applications to gain initial access to networks.",
    examples: [
      "Exploiting unpatched Exchange Server vulnerabilities (ProxyShell/ProxyLogon)",
      "SQL injection against web applications to gain server access",
      "Exploiting VPN appliance vulnerabilities to bypass perimeter controls",
    ],
  },
  "T1078": {
    summary: "Adversaries use legitimate credentials to authenticate and blend in with normal activity.",
    examples: [
      "Logging in with credentials obtained from previous breaches",
      "Using default or unchanged service account passwords",
      "Leveraging stolen VPN credentials to access the internal network",
    ],
  },
  "T1199": {
    summary: "Adversaries exploit trusted third-party relationships to gain access to target networks.",
    examples: [
      "Compromising a managed service provider to pivot to their clients",
      "Injecting malicious code into a software vendor's update pipeline",
      "Abusing trusted VPN connections between partner organizations",
    ],
  },
  "T1059": {
    summary: "Adversaries abuse command-line interpreters and scripting languages to execute commands and scripts.",
    examples: [
      "PowerShell scripts for downloading and executing payloads in memory",
      "Python-based implants for cross-platform post-exploitation",
      "Windows Command Shell one-liners chained via batch scripts",
    ],
  },
  "T1204": {
    summary: "Adversaries rely on user interaction to execute malicious payloads, typically through social engineering.",
    examples: [
      "Tricking users into enabling macros in a phishing document",
      "Disguising malware as a legitimate software installer",
      "Luring users to click malicious links in convincing pretexts",
    ],
  },
  "T1047": {
    summary: "Adversaries use Windows Management Instrumentation to execute commands and move laterally.",
    examples: [
      "Remote process creation on other hosts via WMI for lateral movement",
      "WMI event subscriptions for fileless persistence",
      "Querying WMI for system reconnaissance and inventory",
    ],
  },
  "T1053": {
    summary: "Adversaries abuse task scheduling functionality for persistent or delayed execution.",
    examples: [
      "Creating scheduled tasks to run malware at system startup",
      "Using at/schtasks for remote code execution on other hosts",
      "Cron jobs on Linux systems for persistent backdoor access",
    ],
  },
  "T1547": {
    summary: "Adversaries configure settings to automatically execute programs during system boot or user logon.",
    examples: [
      "Adding malware to the Windows Registry Run keys",
      "Placing malicious shortcuts in the Startup folder",
      "Modifying boot configuration for pre-OS execution",
    ],
  },
  "T1136": {
    summary: "Adversaries create new accounts to maintain access to victim systems.",
    examples: [
      "Creating local admin accounts on compromised hosts as backup access",
      "Adding rogue accounts to Active Directory with elevated privileges",
      "Creating cloud IAM users with programmatic access keys",
    ],
  },
  "T1543": {
    summary: "Adversaries create or modify system-level processes to repeatedly execute malicious payloads.",
    examples: [
      "Installing a malicious Windows service for persistence",
      "Modifying systemd unit files on Linux for backdoor execution",
      "Creating launch daemons on macOS to survive reboots",
    ],
  },
  "T1546": {
    summary: "Adversaries establish persistence by configuring code to execute in response to specific system events.",
    examples: [
      "WMI event subscriptions that trigger on specific conditions",
      "Modifying Windows accessibility features (e.g., Sticky Keys) for backdoor login",
      "AppInit_DLLs that load into every user-mode process",
    ],
  },
  "T1068": {
    summary: "Adversaries exploit software vulnerabilities in privileged processes to escalate from user to admin or SYSTEM.",
    examples: [
      "Kernel exploits to escalate from standard user to SYSTEM",
      "Exploiting misconfigured SUID binaries on Linux",
      "Targeting vulnerable device drivers for ring-0 code execution",
    ],
  },
  "T1548": {
    summary: "Adversaries bypass elevation controls like UAC to gain higher privileges without prompting the user.",
    examples: [
      "UAC bypass techniques using auto-elevating Windows binaries",
      "Abusing sudoers misconfigurations on Linux systems",
      "DLL side-loading into elevated processes",
    ],
  },
  "T1134": {
    summary: "Adversaries manipulate access tokens to operate under a different security context.",
    examples: [
      "Duplicating tokens from privileged processes to impersonate SYSTEM",
      "Creating processes with stolen tokens via token impersonation",
      "Adjusting token privileges to enable disabled security rights",
    ],
  },
  "T1027": {
    summary: "Adversaries obfuscate files and information to make detection and analysis more difficult.",
    examples: [
      "Base64-encoding PowerShell payloads to bypass string-based detection",
      "Packing executables with custom crypters to evade antivirus",
      "Steganography to hide payloads within image files",
    ],
  },
  "T1055": {
    summary: "Adversaries inject code into legitimate processes to evade defenses and elevate privileges.",
    examples: [
      "DLL injection into explorer.exe to hide in a trusted process",
      "Process hollowing to replace a legitimate process's memory with malware",
      "Thread execution hijacking in running system processes",
    ],
  },
  "T1562": {
    summary: "Adversaries disable or tamper with security tools and logging to avoid detection.",
    examples: [
      "Killing or uninstalling endpoint protection agents",
      "Disabling Windows Event Log or Sysmon services",
      "Modifying firewall rules to allow C2 traffic",
    ],
  },
  "T1070": {
    summary: "Adversaries delete or modify artifacts to remove evidence of their presence.",
    examples: [
      "Clearing Windows Event Logs after lateral movement",
      "Timestomping files to match legitimate system files",
      "Deleting command history files on Linux (.bash_history)",
    ],
  },
  "T1003": {
    summary: "Adversaries dump credentials from OS memory, registry, or files to obtain account login information.",
    examples: [
      "Using Mimikatz to extract plaintext passwords from LSASS memory",
      "Dumping the SAM database for local account password hashes",
      "Extracting cached domain credentials via DCSync attacks",
    ],
  },
  "T1110": {
    summary: "Adversaries use brute force techniques to guess credentials and gain access to accounts.",
    examples: [
      "Password spraying common passwords against all domain accounts",
      "Credential stuffing with leaked username/password combinations",
      "Dictionary attacks against exposed RDP or SSH services",
    ],
  },
  "T1557": {
    summary: "Adversaries position themselves between communicating systems to intercept and modify traffic.",
    examples: [
      "ARP spoofing on local networks to intercept authentication traffic",
      "LLMNR/NBT-NS poisoning to capture NTLMv2 hashes",
      "Rogue Wi-Fi access points for credential interception",
    ],
  },
  "T1558": {
    summary: "Adversaries steal or forge Kerberos tickets to move laterally or access resources without credentials.",
    examples: [
      "Kerberoasting to extract service account ticket hashes for offline cracking",
      "Golden Ticket attacks using a compromised KRBTGT hash",
      "Silver Ticket forgery targeting specific services",
    ],
  },
  "T1087": {
    summary: "Adversaries enumerate accounts to understand which users and service accounts exist in the environment.",
    examples: [
      "Querying Active Directory for all domain users and their group memberships",
      "Enumerating local accounts on compromised hosts",
      "Using net user /domain to list domain accounts",
    ],
  },
  "T1082": {
    summary: "Adversaries collect detailed system information to understand the environment and plan next steps.",
    examples: [
      "Running systeminfo to gather OS version, patches, and hardware details",
      "Querying installed software and running services",
      "Enumerating domain trust relationships and forest structure",
    ],
  },
  "T1046": {
    summary: "Adversaries scan internal networks to discover running services and identify lateral movement targets.",
    examples: [
      "Internal port scanning to find database servers and file shares",
      "Scanning for open SMB ports to identify reachable hosts",
      "Service discovery sweeps across internal subnets",
    ],
  },
  "T1069": {
    summary: "Adversaries discover permission groups and their members to identify high-value targets for privilege escalation.",
    examples: [
      "Enumerating Domain Admins and Enterprise Admins group membership",
      "Identifying users in privileged security groups",
      "Querying cloud IAM roles and group permissions",
    ],
  },
  "T1021": {
    summary: "Adversaries use legitimate remote services to move laterally between systems.",
    examples: [
      "RDP sessions to jump between compromised workstations",
      "PsExec or SMB admin shares for remote command execution",
      "SSH connections using stolen keys for Linux lateral movement",
    ],
  },
  "T1570": {
    summary: "Adversaries transfer tools and files between compromised systems within the network.",
    examples: [
      "Copying attack tools via SMB shares to other hosts",
      "Using native OS utilities like SCP or BITSAdmin for internal transfers",
      "Staging tools on internal file shares for other compromised hosts to access",
    ],
  },
  "T1550": {
    summary: "Adversaries use stolen authentication material like hashes or tickets instead of plaintext credentials.",
    examples: [
      "Pass-the-hash attacks using NTLM hashes for authentication",
      "Pass-the-ticket with stolen Kerberos TGTs",
      "Using stolen web session cookies to bypass MFA",
    ],
  },
  "T1560": {
    summary: "Adversaries compress and encrypt collected data before exfiltration to reduce size and avoid detection.",
    examples: [
      "Using 7-Zip or RAR to create password-protected archives of stolen files",
      "Custom encryption of collected data prior to exfiltration",
      "Staging compressed archives in temporary directories for bulk transfer",
    ],
  },
  "T1005": {
    summary: "Adversaries collect sensitive data from local system sources like file systems and databases.",
    examples: [
      "Searching for documents containing keywords like 'password' or 'confidential'",
      "Extracting data from local database files and application stores",
      "Collecting browser-stored credentials and session data",
    ],
  },
  "T1114": {
    summary: "Adversaries collect email data from local clients or mail servers for intelligence gathering.",
    examples: [
      "Exporting Outlook PST files from user workstations",
      "Using Exchange Web Services to search and download mailboxes",
      "Accessing cloud email via compromised OAuth tokens",
    ],
  },
  "T1071": {
    summary: "Adversaries communicate with C2 servers using standard application layer protocols to blend with normal traffic.",
    examples: [
      "HTTPS-based C2 channels disguised as normal web browsing",
      "DNS tunneling for covert command and control",
      "C2 traffic over legitimate cloud service APIs (Slack, Teams, S3)",
    ],
  },
  "T1105": {
    summary: "Adversaries transfer tools and files from external systems into the compromised environment.",
    examples: [
      "Downloading post-exploitation tools via PowerShell or curl",
      "Fetching additional payloads from attacker-controlled cloud storage",
      "Using BITSAdmin or certutil to download files while evading detection",
    ],
  },
  "T1572": {
    summary: "Adversaries tunnel network communications through an existing protocol to avoid detection or network filtering.",
    examples: [
      "SSH tunneling to encapsulate C2 traffic within allowed protocols",
      "DNS-over-HTTPS tunneling to bypass network inspection",
      "Encapsulating traffic within legitimate cloud service protocols",
    ],
  },
  "T1041": {
    summary: "Adversaries exfiltrate stolen data over the existing command and control channel.",
    examples: [
      "Uploading collected files through the HTTPS C2 channel",
      "Chunking large data sets into C2 protocol messages",
      "Using encrypted C2 sessions to blend exfiltration with command traffic",
    ],
  },
  "T1048": {
    summary: "Adversaries exfiltrate data over alternative protocols different from the C2 channel to avoid detection.",
    examples: [
      "Exfiltrating data over DNS queries to attacker-controlled resolvers",
      "Using FTP or SFTP to external servers separate from C2 infrastructure",
      "Sending data through ICMP tunnels or steganographic channels",
    ],
  },
  "T1486": {
    summary: "Adversaries encrypt victim data to extort ransom payments for decryption keys.",
    examples: [
      "Deploying ransomware across domain-joined systems via GPO",
      "Encrypting network shares and backup volumes simultaneously",
      "Double extortion: exfiltrating data before encryption for added leverage",
    ],
  },
  "T1489": {
    summary: "Adversaries stop services to disrupt availability or inhibit recovery before destructive actions.",
    examples: [
      "Stopping SQL Server and Exchange services before encrypting databases",
      "Disabling backup agent services to prevent recovery",
      "Killing antivirus processes prior to deploying ransomware",
    ],
  },
  "T1529": {
    summary: "Adversaries shut down or reboot systems to finalize destructive actions or disrupt availability.",
    examples: [
      "Forcing reboots after MBR modification for wiper deployment",
      "Mass system shutdowns to amplify operational disruption",
      "Scheduled reboots to trigger boot-level ransomware payload",
    ],
  },
  "T1485": {
    summary: "Adversaries destroy data and files to disrupt availability and hinder recovery efforts.",
    examples: [
      "Wiping disk partitions with destructive malware (e.g., WhisperGate)",
      "Overwriting critical files and backups to prevent restoration",
      "Deleting Volume Shadow Copies before deploying destructive payloads",
    ],
  },
};

export const CHAIN_TECHNIQUE_CONTEXT: Record<string, Record<string, string>> = {
  "APT29 / Cozy Bear": {
    "T1199": "Compromised the SolarWinds Orion build process to deliver trojanized updates to ~18,000 organizations",
    "T1059": "Used PowerShell extensively and deployed the SUNBURST backdoor, later using Python-based tooling",
    "T1543": "Installed malicious services masquerading as legitimate SolarWinds components",
    "T1562": "Disabled security logging and tampered with Defender to conceal SUNBURST activity",
    "T1003": "Used DCSync attacks and token manipulation to extract credentials from domain controllers",
    "T1087": "Enumerated privileged accounts and Azure AD roles to identify high-value targets",
    "T1021": "Moved laterally via RDP and SMB using stolen admin credentials across victim networks",
    "T1071": "Used HTTPS C2 mimicking legitimate SolarWinds API traffic to blend with normal activity",
  },
  "Conti Ransomware": {
    "T1566": "Delivered BazarLoader and IcedID via phishing emails with malicious document attachments",
    "T1204": "Relied on victims enabling macros in weaponized Excel and Word documents",
    "T1059": "Used PowerShell and cmd.exe extensively for Cobalt Strike beacon deployment",
    "T1547": "Established persistence via Run keys and startup folder entries for Cobalt Strike beacons",
    "T1068": "Exploited PrintNightmare and ZeroLogon for rapid privilege escalation",
    "T1003": "Ran Mimikatz and used DCSync to harvest domain admin credentials",
    "T1021": "Used PsExec and SMB admin shares for network-wide ransomware deployment",
    "T1486": "Deployed Conti ransomware using group policy, encrypting systems and demanding multi-million dollar ransoms",
  },
  "APT28 / Fancy Bear": {
    "T1598": "Conducted credential phishing campaigns spoofing government and military organizations",
    "T1566": "Sent spearphishing emails with weaponized documents exploiting Office vulnerabilities",
    "T1059": "Deployed X-Agent and X-Tunnel implants executed via PowerShell and command shell",
    "T1055": "Injected code into legitimate browser and system processes to evade endpoint detection",
    "T1003": "Harvested credentials from browsers, mail clients, and LSASS using custom tools",
    "T1558": "Used Kerberoasting and forged tickets to move through Active Directory environments",
    "T1550": "Leveraged stolen Kerberos tickets and NTLM hashes for pass-the-hash/ticket attacks",
    "T1114": "Targeted email servers and OWA to exfiltrate sensitive diplomatic communications",
  },
  "LockBit 3.0": {
    "T1595": "Scanned for exposed RDP, VPN, and web application ports to identify entry points",
    "T1190": "Exploited public-facing Fortinet, Citrix, and Exchange vulnerabilities for initial access",
    "T1059": "Used PowerShell and batch scripts for automated reconnaissance and tool deployment",
    "T1136": "Created new local admin accounts for persistent backup access across hosts",
    "T1548": "Bypassed UAC using known DLL side-loading techniques to gain elevated execution",
    "T1562": "Disabled Windows Defender and other AV products using GMER and Process Hacker",
    "T1003": "Dumped LSASS memory and SAM database to collect domain credentials",
    "T1486": "Deployed LockBit 3.0 ransomware via GPO with automated encryption and ransom note delivery",
  },
  "Lazarus Group": {
    "T1586": "Compromised legitimate accounts and created fake recruiter personas for social engineering",
    "T1078": "Used stolen credentials from supply-chain compromises to access target networks",
    "T1059": "Deployed custom backdoors (BLINDINGCAN, HOPLIGHT) executed via command interpreters",
    "T1546": "Established event-triggered persistence through WMI subscriptions and registry modifications",
    "T1134": "Manipulated access tokens to impersonate higher-privileged accounts",
    "T1055": "Injected custom malware into legitimate processes for defense evasion",
    "T1003": "Extracted credentials using custom tools and Mimikatz for domain escalation",
    "T1048": "Exfiltrated stolen cryptocurrency and data over custom encrypted protocols",
  },
  "FIN7": {
    "T1598": "Conducted reconnaissance phishing impersonating SEC filings and hospitality vendors",
    "T1566": "Sent tailored phishing emails with malicious documents targeting restaurant and retail chains",
    "T1204": "Used convincing social engineering to get targets to open weaponized documents",
    "T1059": "Deployed CARBANAK and Cobalt Strike payloads via JavaScript and PowerShell",
    "T1547": "Persisted through Registry Run keys and scheduled tasks for CARBANAK backdoor",
    "T1027": "Heavily obfuscated JavaScript and PowerShell scripts using custom encoding",
    "T1003": "Extracted payment card data and credentials from POS systems and memory",
    "T1021": "Moved laterally using stolen credentials to access additional POS terminals",
  },
  "Volt Typhoon": {
    "T1190": "Exploited Fortinet FortiGuard and Zoho ManageEngine vulnerabilities for initial access",
    "T1059": "Relied heavily on living-off-the-land binaries (LOLBins) — cmd, PowerShell, wmic, ntdsutil",
    "T1543": "Created Windows services for persistence using native tools to avoid file-based detection",
    "T1548": "Abused elevation mechanisms to run tools with SYSTEM-level privileges",
    "T1070": "Carefully cleaned logs and evidence using wevtutil and other native utilities",
    "T1003": "Used ntdsutil and volume shadow copies to extract Active Directory credentials",
    "T1082": "Performed extensive system and network enumeration using only built-in Windows tools",
    "T1572": "Tunneled C2 traffic through compromised SOHO routers and legitimate network devices",
  },
  "BlackCat / ALPHV": {
    "T1078": "Gained initial access using compromised VPN credentials often purchased from access brokers",
    "T1047": "Used WMI for remote command execution and lateral movement across the network",
    "T1543": "Modified system services to load the Rust-based ransomware payload at boot",
    "T1068": "Exploited privilege escalation vulnerabilities to gain domain-level access",
    "T1562": "Used custom tools to disable endpoint protection and delete volume shadow copies",
    "T1110": "Conducted password spraying against internal services after initial foothold",
    "T1046": "Scanned internal networks to map targets for ransomware deployment",
    "T1486": "Deployed cross-platform Rust-based ransomware with configurable encryption and data leak threats",
  },
};

// F2: Technique Platforms (Built-in Dataset)
export const TECHNIQUE_PLATFORMS: Record<string, string[]> = {
  "T1595": ["Windows", "Linux", "macOS", "Cloud", "Network"],
  "T1598": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1592": ["Windows", "Linux", "macOS"],
  "T1583": ["Windows", "Linux", "macOS", "Cloud"],
  "T1588": ["Windows", "Linux", "macOS"],
  "T1586": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1566": ["Windows", "Linux", "macOS", "SaaS"],
  "T1190": ["Windows", "Linux", "macOS", "Cloud", "Network"],
  "T1078": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1199": ["Windows", "Linux", "macOS", "Cloud"],
  "T1059": ["Windows", "Linux", "macOS"],
  "T1204": ["Windows", "Linux", "macOS"],
  "T1047": ["Windows"],
  "T1053": ["Windows", "Linux", "macOS"],
  "T1547": ["Windows", "Linux", "macOS"],
  "T1136": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1543": ["Windows", "Linux", "macOS"],
  "T1546": ["Windows", "Linux", "macOS"],
  "T1068": ["Windows", "Linux", "macOS"],
  "T1548": ["Windows", "Linux", "macOS"],
  "T1134": ["Windows"],
  "T1027": ["Windows", "Linux", "macOS"],
  "T1055": ["Windows", "Linux", "macOS"],
  "T1562": ["Windows", "Linux", "macOS", "Cloud"],
  "T1070": ["Windows", "Linux", "macOS", "Network"],
  "T1003": ["Windows", "Linux", "macOS"],
  "T1110": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1557": ["Windows", "Linux", "macOS", "Network"],
  "T1558": ["Windows"],
  "T1087": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1082": ["Windows", "Linux", "macOS"],
  "T1046": ["Windows", "Linux", "macOS", "Network"],
  "T1069": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1021": ["Windows", "Linux", "macOS"],
  "T1570": ["Windows", "Linux", "macOS"],
  "T1550": ["Windows", "Linux", "macOS", "Cloud", "SaaS"],
  "T1560": ["Windows", "Linux", "macOS"],
  "T1005": ["Windows", "Linux", "macOS"],
  "T1114": ["Windows", "Cloud", "SaaS"],
  "T1071": ["Windows", "Linux", "macOS", "Network"],
  "T1105": ["Windows", "Linux", "macOS"],
  "T1572": ["Windows", "Linux", "macOS", "Network"],
  "T1041": ["Windows", "Linux", "macOS"],
  "T1048": ["Windows", "Linux", "macOS", "Network"],
  "T1486": ["Windows", "Linux", "macOS"],
  "T1489": ["Windows", "Linux", "macOS"],
  "T1529": ["Windows", "Linux", "macOS"],
  "T1485": ["Windows", "Linux", "macOS"],
};

// F3: MITRE Mitigations (Built-in Dataset)
export const TECHNIQUE_MITIGATIONS: Record<string, Mitigation[]> = {
  "T1595": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1598": [{ mitreId: "M1054", name: "Software Configuration" }, { mitreId: "M1017", name: "User Training" }],
  "T1592": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1583": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1588": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1586": [{ mitreId: "M1056", name: "Pre-compromise" }],
  "T1566": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }, { mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1054", name: "Software Configuration" }, { mitreId: "M1017", name: "User Training" }],
  "T1190": [{ mitreId: "M1048", name: "Application Isolation and Sandboxing" }, { mitreId: "M1050", name: "Exploit Protection" }, { mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1051", name: "Update Software" }, { mitreId: "M1016", name: "Vulnerability Scanning" }],
  "T1078": [{ mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1199": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1032", name: "Multi-factor Authentication" }],
  "T1059": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }, { mitreId: "M1038", name: "Execution Prevention" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1204": [{ mitreId: "M1038", name: "Execution Prevention" }, { mitreId: "M1017", name: "User Training" }],
  "T1047": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1038", name: "Execution Prevention" }],
  "T1053": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1028", name: "Operating System Configuration" }],
  "T1547": [{ mitreId: "M1038", name: "Execution Prevention" }],
  "T1136": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1543": [{ mitreId: "M1047", name: "Audit" }, { mitreId: "M1033", name: "Limit Software Installation" }],
  "T1546": [{ mitreId: "M1038", name: "Execution Prevention" }],
  "T1068": [{ mitreId: "M1048", name: "Application Isolation and Sandboxing" }, { mitreId: "M1050", name: "Exploit Protection" }, { mitreId: "M1051", name: "Update Software" }],
  "T1548": [{ mitreId: "M1047", name: "Audit" }, { mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1028", name: "Operating System Configuration" }],
  "T1134": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1027": [{ mitreId: "M1049", name: "Antivirus/Antimalware" }],
  "T1055": [{ mitreId: "M1040", name: "Behavior Prevention on Endpoint" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1562": [{ mitreId: "M1022", name: "Restrict File and Directory Permissions" }, { mitreId: "M1024", name: "Restrict Registry Permissions" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1070": [{ mitreId: "M1029", name: "Remote Data Storage" }, { mitreId: "M1022", name: "Restrict File and Directory Permissions" }],
  "T1003": [{ mitreId: "M1040", name: "Behavior Prevention on Endpoint" }, { mitreId: "M1043", name: "Credential Access Protection" }, { mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }],
  "T1110": [{ mitreId: "M1036", name: "Account Use Policies" }, { mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1027", name: "Password Policies" }],
  "T1557": [{ mitreId: "M1041", name: "Encrypt Sensitive Information" }, { mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1035", name: "Limit Access to Resource Over Network" }],
  "T1558": [{ mitreId: "M1027", name: "Password Policies" }, { mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1041", name: "Encrypt Sensitive Information" }],
  "T1087": [{ mitreId: "M1028", name: "Operating System Configuration" }],
  "T1082": [],
  "T1046": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1031", name: "Network Intrusion Prevention" }],
  "T1069": [],
  "T1021": [{ mitreId: "M1032", name: "Multi-factor Authentication" }, { mitreId: "M1035", name: "Limit Access to Resource Over Network" }],
  "T1570": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1550": [{ mitreId: "M1026", name: "Privileged Account Management" }, { mitreId: "M1018", name: "User Account Management" }],
  "T1560": [{ mitreId: "M1047", name: "Audit" }],
  "T1005": [{ mitreId: "M1057", name: "Data Loss Prevention" }],
  "T1114": [{ mitreId: "M1041", name: "Encrypt Sensitive Information" }, { mitreId: "M1032", name: "Multi-factor Authentication" }],
  "T1071": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1030", name: "Network Segmentation" }],
  "T1105": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }],
  "T1572": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1041": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1057", name: "Data Loss Prevention" }],
  "T1048": [{ mitreId: "M1031", name: "Network Intrusion Prevention" }, { mitreId: "M1057", name: "Data Loss Prevention" }, { mitreId: "M1037", name: "Filter Network Traffic" }],
  "T1486": [{ mitreId: "M1053", name: "Data Backup" }, { mitreId: "M1040", name: "Behavior Prevention on Endpoint" }],
  "T1489": [{ mitreId: "M1030", name: "Network Segmentation" }, { mitreId: "M1022", name: "Restrict File and Directory Permissions" }],
  "T1529": [],
  "T1485": [{ mitreId: "M1053", name: "Data Backup" }],
};

// F3: Maps MITRE mitigation names → our SECURITY_CONTROLS IDs
export const MITIGATION_CONTROL_MAP: Record<string, string> = {
  "Multi-factor Authentication": "mfa",
  "Network Segmentation": "seg",
  "Privileged Account Management": "pam",
  "Update Software": "patch",
  "Vulnerability Scanning": "vuln-scan",
  "User Training": "training",
  "Network Intrusion Prevention": "ids",
  "Data Loss Prevention": "dlp",
  "Data Backup": "backup",
  "Antivirus/Antimalware": "edr",
  "Application Isolation and Sandboxing": "sandbox",
  "Behavior Prevention on Endpoint": "edr",
  "Execution Prevention": "app-wl",
  "Encrypt Sensitive Information": "tls-inspect",
  "Filter Network Traffic": "dns-filter",
  "Exploit Protection": "edr",
  "Credential Access Protection": "secrets",
  "Password Policies": "ad-harden",
  "User Account Management": "identity-gov",
  "Restrict File and Directory Permissions": "least-priv",
  "Account Use Policies": "access-review",
  "Audit": "log-mgmt",
  "Operating System Configuration": "secure-build",
  "Remote Data Storage": "backup",
  "Limit Access to Resource Over Network": "ztna",
  "Limit Software Installation": "app-wl",
  "Restrict Registry Permissions": "least-priv",
};

// F7: Threat Actor Profiles (Built-in Dataset)
export const CHAIN_PROFILES: Record<string, ChainProfile> = {
  "APT29 / Cozy Bear": {
    country: "Russia (SVR)", aliases: ["Cozy Bear", "The Dukes", "Nobelium", "Midnight Blizzard"],
    firstSeen: "2008", lastSeen: "2024", sectors: ["Government", "Diplomacy", "Think Tanks", "Healthcare", "Technology"],
    description: "Russian Foreign Intelligence Service (SVR) unit specializing in long-term espionage operations against Western governments and organizations. Known for the SolarWinds supply chain attack (2020) and numerous diplomatic espionage campaigns.",
  },
  "Conti Ransomware": {
    country: "Russia", aliases: ["Wizard Spider", "Gold Blackburn"],
    firstSeen: "2020", lastSeen: "2022", sectors: ["Healthcare", "Government", "Manufacturing", "All"],
    description: "One of the most prolific ransomware-as-a-service operations. Caused an estimated $180M+ in damages. Disbanded after internal leaks in 2022, with members splintering into Royal, Black Basta, and other groups.",
  },
  "APT28 / Fancy Bear": {
    country: "Russia (GRU)", aliases: ["Fancy Bear", "Sofacy", "Strontium", "Forest Blizzard"],
    firstSeen: "2004", lastSeen: "2024", sectors: ["Government", "Military", "Defense", "Journalism", "Political Organizations"],
    description: "Russian GRU Unit 26165 cyber-espionage group. Responsible for the 2016 DNC hack, attacks on the German Bundestag, and campaigns against NATO and Olympic organizations.",
  },
  "LockBit 3.0": {
    country: "Russia / Global Affiliates", aliases: ["LockBit Black", "LockBit Gang"],
    firstSeen: "2019", lastSeen: "2024", sectors: ["Manufacturing", "Healthcare", "Financial", "Government", "All"],
    description: "Most active ransomware-as-a-service operation globally. Uses an affiliate model with an automated attack platform. Law enforcement disrupted infrastructure in Feb 2024 (Operation Cronos).",
  },
  "Lazarus Group": {
    country: "North Korea (DPRK)", aliases: ["Hidden Cobra", "Zinc", "Diamond Sleet"],
    firstSeen: "2009", lastSeen: "2024", sectors: ["Financial", "Cryptocurrency", "Defense", "Entertainment"],
    description: "DPRK-linked group responsible for the Sony Pictures hack (2014), Bangladesh Bank heist (2016), WannaCry (2017), and over $1.5B in cryptocurrency thefts. Motivated by both espionage and revenue generation.",
  },
  "FIN7": {
    country: "Russia / Ukraine", aliases: ["Carbanak", "Navigator", "Sangria Tempest"],
    firstSeen: "2013", lastSeen: "2024", sectors: ["Retail", "Hospitality", "Restaurant", "Financial"],
    description: "Financially motivated group that has stolen over $1B from hundreds of companies. Known for sophisticated social engineering and custom malware targeting point-of-sale systems. Multiple members arrested 2018-2023.",
  },
  "Volt Typhoon": {
    country: "China (PRC)", aliases: ["Bronze Silhouette", "Vanguard Panda"],
    firstSeen: "2021", lastSeen: "2024", sectors: ["Critical Infrastructure", "Government", "Telecommunications", "Energy"],
    description: "Chinese state-sponsored group focused on pre-positioning in US critical infrastructure. Relies almost exclusively on living-off-the-land techniques to avoid detection. Targeted Guam and US communications sectors.",
  },
  "BlackCat / ALPHV": {
    country: "Russia / Global Affiliates", aliases: ["ALPHV", "Noberus"],
    firstSeen: "2021", lastSeen: "2024", sectors: ["Healthcare", "Financial", "Legal", "Technology", "All"],
    description: "First ransomware written in Rust for cross-platform targeting. Employed triple extortion (encryption + data leak + DDoS). Notable attacks on MGM Resorts and Change Healthcare. Seized by FBI Dec 2023, briefly resurfaced.",
  },
};
