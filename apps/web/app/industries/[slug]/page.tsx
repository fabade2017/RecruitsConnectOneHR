import type { Metadata } from 'next';
import IndustryPage from '../../../components/marketing/IndustryPage';
import { industries, industryBySlug } from '../../../lib/industries';

export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map(i => ({ slug: i.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const industry = industryBySlug(params.slug);
  if (!industry) return { title: 'OneHR for your industry' };
  return {
    title: `${industry.headline} | RecruitConnect OneHR`,
    description: industry.subheadline,
  };
}

export default function IndustryRoute({ params }: { params: { slug: string } }) {
  return <IndustryPage slug={params.slug} />;
}
