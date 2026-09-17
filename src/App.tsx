import { useState } from 'react'
import { Sidebar, type Tab } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { BudgetBar } from './components/BudgetBar'
import { CalendarView } from './pages/CalendarView'
import { FlightsView } from './pages/FlightsView'
import { BudgetView } from './pages/BudgetView'
import { ActivitiesView } from './pages/ActivitiesView'
import { TeamView } from './pages/TeamView'
import { ContactsView } from './pages/ContactsView'
import { SettingsView } from './pages/SettingsView'

const TITLES: Record<Tab, string> = {
  calendar: 'Calendar',
  flights: 'Flights',
  budget: 'Budget',
  activities: 'Activities',
  team: 'Team',
  contacts: 'Key Contacts',
  settings: 'Settings',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('calendar')

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50">
      <Sidebar tab={tab} onTab={setTab} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar title={TITLES[tab]} />
        {(tab === 'calendar' || tab === 'budget') && <BudgetBar />}
        <div className="flex-1 pb-20 md:pb-0">
          {tab === 'calendar' && <CalendarView />}
          {tab === 'flights' && <FlightsView />}
          {tab === 'budget' && <BudgetView />}
          {tab === 'activities' && <ActivitiesView />}
          {tab === 'team' && <TeamView />}
          {tab === 'contacts' && <ContactsView />}
          {tab === 'settings' && <SettingsView />}
        </div>
      </main>
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  )
}
