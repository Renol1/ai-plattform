import { redirect } from 'next/navigation';

export default async function Page(_props: { params: Promise<{ id: string }> }) {
  // This route is deprecated in favor of the embedded widget.
  redirect('/chatkit');
  return null;
}
