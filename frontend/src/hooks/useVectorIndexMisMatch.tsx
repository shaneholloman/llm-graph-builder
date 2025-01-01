import { useCallback } from 'react';
import { useCredentials } from '../context/UserCredentials';
import { dbinfo, withuserdimension } from '../types';

export default function useVectorIndexMismatchAlert(resetConnection: (connectionState: withuserdimension) => void) {
  const { setConnectionStatus } = useCredentials();

  const checkVectorIndex = useCallback((response: dbinfo) => {
    if (response.application_dimension === response.db_vector_dimension || response.db_vector_dimension == 0) {
      setConnectionStatus(true);
    } else {
      setConnectionStatus(false);
      resetConnection({
        openPopUp: true,
        chunksExistsWithDifferentDimension:
          response.db_vector_dimension != 0 && response.db_vector_dimension != response.application_dimension,
        vectorIndexMisMatch: true,
        uservectordimenstion: response.db_vector_dimension,
        chunksExists: true,
        trigger: 'extract',
      });
    }
  }, []);

  return {
    checkVectorIndex,
  };
}
