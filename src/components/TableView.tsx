// Table.tsx
import { useMemo } from 'react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule])

export default function TableView({ data, columns }: { data: any[], columns: string[] }) {
  const columnDefs: ColDef[] = useMemo(() => {
    return Object.values(columns).map((val, key) => ({
      field: key.toString(),
      headerName: val.toUpperCase(),
      sortable: true,
      filter: true,
      resizable: true,
    }))
  }, [columns])


  return (
    <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
      <AgGridReact
        gridOptions={{ theme: 'legacy' }}
        rowData={data}
        columnDefs={columnDefs}
      />
    </div>
  );
}
