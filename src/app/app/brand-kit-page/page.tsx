import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Brand Kit Overview | ContentOSX',
  description: 'Legacy route redirected to /app/brand-kit overview',
};

export default async function BrandKitOverviewPage() {
  redirect('/app/brand-kit');
}
