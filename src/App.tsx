import { useState } from 'react'
import { Sidebar, type Tab } from './components/Sidebar'
import { BottomNav } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { OverviewView } from './pages/OverviewView'
import { CalendarView } from './pages/CalendarView'
import { FlightsView } from './pages/FlightsView'
import { BudgetView } from './pages/BudgetView'
import { ActivitiesView } from './pages/ActivitiesView'
import { TeamView } from './pages/TeamView'
import { ContactsView } from './pages/ContactsView'
import { SettingsView } from './pages/SettingsView'

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-50">
      <Sidebar tab={tab} onTab={setTab} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <TopBar onHome={setTab} />
        <div className="flex-1 pb-20 md:pb-0">
          {tab === 'overview' && <OverviewView onNavigate={setTab} />}
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
