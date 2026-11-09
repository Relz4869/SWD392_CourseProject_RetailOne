'use client';

import PageHeader from '@/shared/components/PageHeader';
import ErrorMessage from '@/shared/components/ErrorMessage';
import Spinner from '@/shared/components/Spinner';
import useHandoverReport from '../hooks/useHandoverReport';
import HandoverReportFilters from './HandoverReportFilters';
import HandoverSummary from './HandoverSummary';
import HandoverReportList from './HandoverReportList';
import HandoverReportDetail from './HandoverReportDetail';
import styles from './handoverReport.module.css';

export default function HandoverReportView() {
  const state = useHandoverReport();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Báo cáo bàn giao tiền"
        subtitle="Theo dõi các bàn giao đã hoàn tất và trạng thái duyệt"
      />

      <HandoverReportFilters
        filters={state.filters}
        staffOptions={state.data?.staffOptions || []}
        loading={state.loading}
        onApply={state.applyFilters}
        onReset={state.resetFilters}
      />

      {state.error && <ErrorMessage message={state.error} onRetry={state.reload} />}
      {state.loading && !state.data && <div className={styles.loadingCard}><Spinner center /></div>}
      {state.data && (
        <>
          <HandoverSummary summary={state.data.summary} />
          <HandoverReportList
            data={state.data}
            loading={state.loading}
            onOpen={state.openDetail}
            onPageChange={state.changePage}
            onPageSizeChange={state.changePageSize}
          />
        </>
      )}

      <HandoverReportDetail
        detail={state.detail}
        loading={state.detailLoading}
        error={state.detailError}
        onClose={state.closeDetail}
      />
    </div>
  );
}
