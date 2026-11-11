import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addDays, addMonths, format, set, startOfMonth } from 'date-fns';
import App from '../App';
import { TaskUIProvider } from '../components/TaskUIProvider';
import { installFakeApi } from './fakeApi';

const today = (h) => set(new Date(), { hours: h, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString();

function renderApp(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <TaskUIProvider>
          <App />
        </TaskUIProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

let db;
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('todo.onboarded', '1');
  db = installFakeApi([
    { title: 'Finishing Wireframe', dueDate: today(9), priority: 'high' },
    { title: 'Meeting with team', dueDate: today(11), description: 'finish agenda' },
    { title: 'Buy a cat food', dueDate: today(15), status: 'completed' },
    { title: 'Far future task', dueDate: addDays(new Date(), 60).toISOString() },
  ]);
});

const statValue = (label) => screen.getByText(label).closest('div').parentElement.querySelector('p span');

describe('Onboarding', () => {
  it('shows onboarding first and continues to home', async () => {
    localStorage.clear();
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    expect((await screen.findAllByText('Finishing Wireframe')).length).toBeGreaterThan(0);
  });
});

describe('Home', () => {
  it("lists today's tasks and this week's completed / pending counts", async () => {
    renderApp();
    expect(await screen.findByText('Finishing Wireframe')).toBeInTheDocument();
    expect(screen.getByText('Tasks Today')).toBeInTheDocument();
    expect(screen.queryByText('Far future task')).not.toBeInTheDocument();
    await waitFor(() => expect(statValue('Task Complete')).toHaveTextContent('01'));
    expect(statValue('Task Pending')).toHaveTextContent('02');
  });

  it('marking a task completed updates the counts', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('checkbox', { name: /Mark "Meeting with team" as completed/ }));
    await waitFor(() => expect(statValue('Task Complete')).toHaveTextContent('02'));
    expect(statValue('Task Pending')).toHaveTextContent('01');
    expect(db.find((t) => t.title === 'Meeting with team').status).toBe('completed');
  });

  it('creates a task through the Add Task sheet, validating the title', async () => {
    renderApp();
    await screen.findByText('Finishing Wireframe');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));

    const dialog = screen.getByRole('dialog', { name: 'Add New Task' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));
    expect(within(dialog).getByText('Task title is required')).toBeInTheDocument();
    expect(within(dialog).getByText('Start time is required')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Start time' })).toHaveTextContent('Start');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Start time' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Start time' })).getByRole('button', { name: 'OK' }));

    await userEvent.type(within(dialog).getByLabelText('Task title'), 'Doing Homework');
    await userEvent.click(within(dialog).getByRole('radio', { name: 'high' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(db.at(-1)).toMatchObject({ title: 'Doing Homework', priority: 'high' });
  });

  it('edits a task', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('button', { name: 'Edit "Finishing Wireframe"' }));
    const input = screen.getByLabelText('Task title');
    await userEvent.clear(input);
    await userEvent.type(input, 'Final Wireframe');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect((await screen.findAllByText('Final Wireframe')).length).toBeGreaterThan(0);
  });

  it('deletes a task', async () => {
    renderApp();
    await userEvent.click(await screen.findByRole('button', { name: 'Delete "Buy a cat food"' }));
    await waitFor(() => expect(screen.queryByText('Buy a cat food')).not.toBeInTheDocument());
    expect(db.some((t) => t.title === 'Buy a cat food')).toBe(false);
  });

  it('shows weekly cards with open / completed counts and expands them', async () => {
    renderApp();
    const overview = (await screen.findByText('Weekly Overview')).closest('section');
    const cards = await within(overview).findAllByRole('button', { expanded: true });
    expect(cards).toHaveLength(1); // current week expanded by default
    expect(cards[0]).toHaveTextContent('2 Open');
    expect(cards[0]).toHaveTextContent('1 Completed');

    const future = within(overview).getByRole('button', { expanded: false });
    await userEvent.click(future);
    expect(await within(overview).findByText('Far future task')).toBeInTheDocument();
  });
});

describe('Search', () => {
  it('finds tasks by title or description', async () => {
    renderApp('/search');
    await userEvent.type(screen.getByLabelText('Search tasks'), 'finish');
    expect(await screen.findByText('Finishing Wireframe')).toBeInTheDocument();
    expect(screen.getByText('Meeting with team')).toBeInTheDocument(); // description match
    expect(screen.queryByText('Buy a cat food')).not.toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('opens task details from a result', async () => {
    renderApp('/search');
    await userEvent.type(screen.getByLabelText('Search tasks'), 'cat');
    await userEvent.click(await screen.findByText('Buy a cat food'));
    const dialog = screen.getByRole('dialog', { name: 'Task Details' });
    expect(within(dialog).getByText('Completed')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Mark as In Progress' })).toBeInTheDocument();
  });
});

describe('Clock time picker', () => {
  it('sets start and end times with the analog dial', async () => {
    renderApp();
    await screen.findAllByText('Finishing Wireframe');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    const form = screen.getByRole('dialog', { name: 'Add New Task' });

    // Start: pick 10:15 PM via the dial's keyboard support
    await userEvent.click(within(form).getByRole('button', { name: /^Start time/ }));
    let clock = screen.getByRole('dialog', { name: 'Start time' });
    const dial = within(clock).getByRole('slider', { name: 'Hour' });
    dial.focus();
    const hour = Number(dial.getAttribute('aria-valuenow'));
    for (let i = 0; i < (10 - hour + 12) % 12; i++) await userEvent.keyboard('{ArrowUp}');
    await userEvent.click(within(clock).getByRole('button', { name: 'Minutes' }));
    within(clock).getByRole('slider', { name: 'Minute' }).focus();
    for (let i = 0; i < 15; i++) await userEvent.keyboard('{ArrowUp}');
    await userEvent.click(within(clock).getByRole('button', { name: 'PM' }));
    await userEvent.click(within(clock).getByRole('button', { name: 'OK' }));
    expect(within(form).getByRole('button', { name: 'Start time: 10:15 PM' })).toBeInTheDocument();

    // Ends: 11:15 PM
    await userEvent.click(within(form).getByRole('button', { name: 'Ends time' }));
    clock = screen.getByRole('dialog', { name: 'Ends time' });
    const endDial = within(clock).getByRole('slider', { name: 'Hour' });
    endDial.focus();
    const endHour = Number(endDial.getAttribute('aria-valuenow'));
    for (let i = 0; i < (11 - endHour + 12) % 12; i++) await userEvent.keyboard('{ArrowUp}');
    await userEvent.click(within(clock).getByRole('button', { name: 'Minutes' }));
    within(clock).getByRole('slider', { name: 'Minute' }).focus();
    const endMin = within(clock).getByRole('slider', { name: 'Minute' });
    for (let i = 0; i < (15 - Number(endMin.getAttribute('aria-valuenow')) + 60) % 60; i++) await userEvent.keyboard('{ArrowUp}');
    await userEvent.click(within(clock).getByRole('button', { name: 'PM' }));
    await userEvent.click(within(clock).getByRole('button', { name: 'OK' }));

    await userEvent.type(within(form).getByLabelText('Task title'), 'Late task');
    await userEvent.click(within(form).getByRole('button', { name: 'Create task' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const created = db.at(-1);
    expect(new Date(created.dueDate).getHours()).toBe(22);
    expect(new Date(created.dueDate).getMinutes()).toBe(15);
    expect(new Date(created.endDate).getHours()).toBe(23);
  });
});

describe('Date picker', () => {
  it('shows the date as "Weekday d, Month" and picks a new day from the calendar', async () => {
    renderApp();
    await screen.findAllByText('Finishing Wireframe');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    const form = screen.getByRole('dialog', { name: 'Add New Task' });

    const field = within(form).getByLabelText('Set Date');
    expect(field).toHaveTextContent(format(new Date(), 'EEEE d, MMMM'));

    await userEvent.click(field);
    const cal = screen.getByRole('dialog', { name: format(new Date(), 'MMMM yyyy') });
    await userEvent.click(within(cal).getByRole('button', { name: 'Next month' }));
    const target = addMonths(startOfMonth(new Date()), 1);
    await userEvent.click(within(cal).getByRole('button', { name: format(target, 'EEEE, d MMMM yyyy') }));
    await userEvent.click(within(cal).getByRole('button', { name: 'OK' }));

    expect(field).toHaveTextContent(format(target, 'EEEE d, MMMM'));
  });
});
