import { WorkspaceGuard } from '../../../components/dashboard/workspace-guard';

export default function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceGuard>{children}</WorkspaceGuard>;
}
