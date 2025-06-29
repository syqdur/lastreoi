// Theme configuration for galleries
export interface ThemeConfig {
  id: 'hochzeit' | 'geburtstag' | 'urlaub' | 'eigenes';
  name: string;
  icon: string;
  color: string;
  gradient: string;
  texts: {
    // Main gallery texts
    welcomeTitle: string;
    uploadPrompt: string;
    shareInvitation: string;
    momentsText: string;
    memoriesText: string;
    
    // Upload section texts
    uploadPhoto: string;
    uploadVideo: string;
    recordVideo: string;
    addNote: string;
    addStory: string;
    
    // Navigation texts
    timelineTab: string;
    galleryTab: string;
    musicTab: string;
    
    // Timeline texts
    timelineTitle: string;
    timelineSubtitle: string;
    addEventButton: string;
    firstEventButton: string;
    noEventsTitle: string;
    noEventsMessage: string;
    
    // Admin texts
    adminTitle: string;
    settingsTitle: string;
    
    // Default descriptions
    defaultDescription: string;
    welcomeMessage: string;
  };
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    gradientFrom: string;
    gradientTo: string;
    bgGradient: string;
    buttonGradient: string;
    textGradient: string;
  };
}

export const GALLERY_THEMES: Record<string, ThemeConfig> = {
  hochzeit: {
    id: 'hochzeit',
    name: 'Hochzeit',
    icon: '💍',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    texts: {
      welcomeTitle: 'Unsere Hochzeit',
      uploadPrompt: 'Teilt eure schönsten Hochzeitsmomente',
      shareInvitation: 'Lasst uns gemeinsam diesen besonderen Tag festhalten',
      momentsText: 'Hochzeitsmomente',
      memoriesText: 'Liebeserinnerungen',
      uploadPhoto: 'Hochzeitsfoto teilen',
      uploadVideo: 'Hochzeitsvideo teilen',
      recordVideo: 'Moment aufnehmen',
      addNote: 'Glückwunsch schreiben',
      addStory: 'Story hinzufügen',
      timelineTab: 'Unser Tag',
      galleryTab: 'Galerie',
      musicTab: 'Hochzeitsmusik',
      timelineTitle: '💕 Unsere Liebesgeschichte',
      timelineSubtitle: 'Die wichtigsten Momente unserer Beziehung',
      addEventButton: 'Event hinzufügen',
      firstEventButton: 'Erstes Event hinzufügen',
      noEventsTitle: 'Noch keine Events',
      noEventsMessage: 'Füge das erste Event eurer Liebesgeschichte hinzu!',
      adminTitle: 'Hochzeits-Verwaltung',
      settingsTitle: 'Galerie-Einstellungen',
      defaultDescription: 'Wir sagen JA! ✨ Teilt eure schönsten Momente unserer Hochzeit mit uns!',
      welcomeMessage: 'Herzlich willkommen zu unserer Hochzeit! 💕'
    },
    styles: {
      primaryColor: 'pink-500',
      secondaryColor: 'rose-400',
      accentColor: 'pink-600',
      gradientFrom: 'pink-500',
      gradientTo: 'rose-500',
      bgGradient: 'from-pink-500/20 via-rose-400/10 to-pink-300/20',
      buttonGradient: 'from-pink-500 to-rose-500',
      textGradient: 'from-pink-600 to-rose-600'
    }
  },
  geburtstag: {
    id: 'geburtstag',
    name: 'Geburtstag',
    icon: '🎂',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    texts: {
      welcomeTitle: 'Meine Geburtstagsparty',
      uploadPrompt: 'Teilt eure coolsten Party-Momente',
      shareInvitation: 'Lasst uns zusammen feiern und Erinnerungen sammeln',
      momentsText: 'Party-Momente',
      memoriesText: 'Geburtstags-Erinnerungen',
      uploadPhoto: 'Party-Foto teilen',
      uploadVideo: 'Party-Video teilen',
      recordVideo: 'Moment aufnehmen',
      addNote: 'Geburtstagswunsch schreiben',
      addStory: 'Party-Story hinzufügen',
      timelineTab: 'Mein Tag',
      galleryTab: 'Party-Galerie',
      musicTab: 'Party-Playlist',
      timelineTitle: '🎂 Meine Lebensgeschichte',
      timelineSubtitle: 'Die wichtigsten Momente meines Lebens',
      addEventButton: 'Event hinzufügen',
      firstEventButton: 'Erstes Event hinzufügen',
      noEventsTitle: 'Noch keine Events',
      noEventsMessage: 'Füge das erste Event deiner Lebensgeschichte hinzu!',
      adminTitle: 'Party-Verwaltung',
      settingsTitle: 'Party-Einstellungen',
      defaultDescription: 'Let\'s Party! 🎉 Sammelt hier alle tollen Momente meiner Geburtstagsfeier!',
      welcomeMessage: 'Willkommen zu meiner Geburtstagsparty! 🎂'
    },
    styles: {
      primaryColor: 'purple-500',
      secondaryColor: 'violet-400',
      accentColor: 'purple-600',
      gradientFrom: 'purple-500',
      gradientTo: 'violet-500',
      bgGradient: 'from-purple-500/20 via-violet-400/10 to-purple-300/20',
      buttonGradient: 'from-purple-500 to-violet-500',
      textGradient: 'from-purple-600 to-violet-600'
    }
  },
  urlaub: {
    id: 'urlaub',
    name: 'Urlaub',
    icon: '🏖️',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    texts: {
      welcomeTitle: 'Unser Traumurlaub',
      uploadPrompt: 'Teilt eure schönsten Reisemomente',
      shareInvitation: 'Lasst uns gemeinsam diese Reise dokumentieren',
      momentsText: 'Reise-Momente',
      memoriesText: 'Urlaubs-Erinnerungen',
      uploadPhoto: 'Reise-Foto teilen',
      uploadVideo: 'Reise-Video teilen',
      recordVideo: 'Moment aufnehmen',
      addNote: 'Reise-Notiz schreiben',
      addStory: 'Reise-Story hinzufügen',
      timelineTab: 'Unsere Reise',
      galleryTab: 'Reise-Galerie',
      musicTab: 'Reise-Playlist',
      timelineTitle: '🏖️ Unsere Reisegeschichte',
      timelineSubtitle: 'Die besten Momente unseres Urlaubs',
      addEventButton: 'Reise-Event hinzufügen',
      firstEventButton: 'Erstes Reise-Event hinzufügen',
      noEventsTitle: 'Noch keine Reise-Events',
      noEventsMessage: 'Füge das erste Event eurer Reise hinzu!',
      adminTitle: 'Reise-Verwaltung',
      settingsTitle: 'Galerie-Einstellungen',
      defaultDescription: 'Unser Traumurlaub! 🌴 Hier sammeln wir alle Highlights unserer Reise!',
      welcomeMessage: 'Willkommen zu unseren Urlaubserinnerungen! ✈️'
    },
    styles: {
      primaryColor: 'blue-500',
      secondaryColor: 'cyan-400',
      accentColor: 'blue-600',
      gradientFrom: 'blue-500',
      gradientTo: 'cyan-500',
      bgGradient: 'from-blue-500/20 via-cyan-400/10 to-blue-300/20',
      buttonGradient: 'from-blue-500 to-cyan-500',
      textGradient: 'from-blue-600 to-cyan-600'
    }
  },
  eigenes: {
    id: 'eigenes',
    name: 'Eigenes Event',
    icon: '🎊',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    texts: {
      welcomeTitle: 'Unser besonderes Event',
      uploadPrompt: 'Teilt eure besten Momente',
      shareInvitation: 'Lasst uns gemeinsam dieses Event festhalten',
      momentsText: 'Event-Momente',
      memoriesText: 'Event-Erinnerungen',
      uploadPhoto: 'Foto teilen',
      uploadVideo: 'Video teilen',
      recordVideo: 'Moment aufnehmen',
      addNote: 'Nachricht schreiben',
      addStory: 'Story hinzufügen',
      timelineTab: 'Unser Event',
      galleryTab: 'Galerie',
      musicTab: 'Musik',
      timelineTitle: '🎊 Unsere Event-Geschichte',
      timelineSubtitle: 'Die Highlights unseres besonderen Events',
      addEventButton: 'Event hinzufügen',
      firstEventButton: 'Erstes Event hinzufügen',
      noEventsTitle: 'Noch keine Events',
      noEventsMessage: 'Füge das erste Event hinzu!',
      adminTitle: 'Event-Verwaltung',
      settingsTitle: 'Galerie-Einstellungen',
      defaultDescription: 'Unser besonderes Event! ✨ Teilt hier eure schönsten Momente mit uns!',
      welcomeMessage: 'Herzlich willkommen! 🎊'
    },
    styles: {
      primaryColor: 'green-500',
      secondaryColor: 'emerald-400',
      accentColor: 'green-600',
      gradientFrom: 'green-500',
      gradientTo: 'emerald-500',
      bgGradient: 'from-green-500/20 via-emerald-400/10 to-green-300/20',
      buttonGradient: 'from-green-500 to-emerald-500',
      textGradient: 'from-green-600 to-emerald-600'
    }
  }
};

export function getThemeConfig(theme: string): ThemeConfig {
  return GALLERY_THEMES[theme] || GALLERY_THEMES.hochzeit;
}

export function getThemeIcon(theme: string): string {
  return getThemeConfig(theme).icon;
}

export function getThemeGradient(theme: string): string {
  return getThemeConfig(theme).gradient;
}

export function getThemeTexts(theme: string) {
  return getThemeConfig(theme).texts;
}

export function getThemeStyles(theme: string) {
  return getThemeConfig(theme).styles;
}