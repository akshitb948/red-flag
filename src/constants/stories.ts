export interface BreakupStory {
  id: string;
  title: string;
  preview: string;
  fullStory: string;
  category: string;
  toxicityScore: number;
  reactions: string[];
  takeaway: string;
}

export const BREAKUP_STORIES: BreakupStory[] = [
  {
    id: "1",
    title: "The Good Morning Ghost 👻",
    preview: "3 saal ka relationship, aur ek din 'Good Morning' ke baad seedha block. No closure, just system failure.",
    fullStory: "Hum 3 saal se saath the. Everything was perfect. Last message tha 'Good morning baby, missed you'. Uske 10 minute baad call kiya toh block. WhatsApp pe block, Instagram pe block. Maine socha device hang ho gaya, par nahi, mera life ka system hi crash ho gaya tha. 2 mahine baad pata chala unhone 'vibe change' ki wajah se block kiya. Closure ke naam pe bas Blue Tick tak taras gaye.",
    category: "Ghosted",
    toxicityScore: 95,
    reactions: ["💀", "😭", "🚩"],
    takeaway: "No response is also a response. Silence is the loudest closure you'll ever get."
  },
  {
    id: "2",
    title: "Loyal Clown Arc 🤡",
    preview: "Maine unke liye saare friends chhod diye, aur unhone mujhe 'too available' bol kar chhod diya.",
    fullStory: "Maine unki har zidd maani. Friends ke saath plan cancel kiye because unka 'mood nahi tha'. Unke har toxic trait ko 'protection' samjha. Phir ek din bole, 'Tu bahut achi hai par mujhe thoda excitement chahiye, tu bahut predictable ho gayi hai'. Matlab loyalty ab boring ho gayi? Main toh certified loyal clown ban gaya tha pure ek saal tak.",
    category: "Loyal Clown",
    toxicityScore: 88,
    reactions: ["🤡", "💔", "😭"],
    takeaway: "Excess of anything is bad, even loyalty. Never lose yourself while trying to keep someone else."
  },
  {
    id: "3",
    title: "The 'Just Friends' Plot Twist 🐍",
    preview: "Wo 'bestie' jiske baare mein humesha bola 'he’s just like a brother', wahi last mein actual soulmate nikla.",
    fullStory: "Humesha bola, 'Oye, wo toh mera bhai jaisa hai, tu faltu mein insecure hota hai'. Maine trust kiya. Phir mera breakup hua, aur 2 hafte baad unki pictures aayi usi 'bhai' ke saath, captions the 'Finaly found my soulmate'. Vibe hi change ho gayi bhai. Relationships change hote rehte hain par ye 'just friends' wala script wahi purana hai.",
    category: "Red Flag",
    toxicityScore: 92,
    reactions: ["🐍", "🚩", "😂"],
    takeaway: "Trust your gut feelings. Intuition often spots the red flags that the heart ignores."
  },
  {
    id: "4",
    title: "Situationship ka Siyappa 🌫️",
    preview: "Date pe ja rahe the, family se milwa rahi thi, par jab 'label' maanga toh boli 'I'm not ready for a commitment'.",
    fullStory: "Hum 6 mahine se date kar rahe the. Weekend trips, family dinners, late night calls - sab ho raha tha. Ek din maine pucha 'What are we?', toh response aaya 'Yaar labels are so toxic, lets just flow with the vibe'. Agle din unhe kisi aur ke saath 'flow' karte dekha Mall mein. Situationship mein commitment nahi, bas confusion ka free subscription milta hai.",
    category: "Situationship",
    toxicityScore: 85,
    reactions: ["💀", "🤨", "😭"],
    takeaway: "Clear communication saves time. If a person isn't ready for a label, they aren't ready for you."
  },
  {
    id: "5",
    title: "Job Interview Breakup 💼",
    preview: "Phone pe breakdown kar raha tha, aur unhone bola 'I'll talk to you when you are in a better mood'. Talk never happened.",
    fullStory: "Mera career ka lowest point chal raha tha. Main roya, support maanga. Unka reply? 'Ye negativity mujhe affect kar rahi hai, jab theek ho jaao tab message karna'. Relationship tha ya koi internship? Thode din baad pata chala unhe 'high value' partner chahiye tha jo kabhi sad na ho. Emotional damage full throttle pe tha.",
    category: "Emotional Damage",
    toxicityScore: 98,
    reactions: ["💔", "😤", "🚩"],
    takeaway: "People who only want you at your best don't deserve you at your worst."
  }
];
