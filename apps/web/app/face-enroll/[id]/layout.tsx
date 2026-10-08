// Static export requires every dynamic route to declare its params at build time.
// Employee IDs are runtime DB values, so we emit a single placeholder page; Apache
// (.htaccess) rewrites /face-enroll/<any-id> to it, and the client page above reads
// the real id from the URL via useParams().
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function FaceEnrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}