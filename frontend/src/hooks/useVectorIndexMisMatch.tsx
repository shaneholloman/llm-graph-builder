import { useCallback } from 'react';
import { useCredentials } from '../context/UserCredentials';
import { dbinfo, withuserdimension } from '../types';

export default function useVectorIndexMismatchAlert(resetConnection: (connectionState: withuserdimension) => void) {
  const { setConnectionStatus, userCredentials } = useCredentials();

  const checkVectorIndex = useCallback((response: dbinfo) => {
    if (response.application_dimension === response.db_vector_dimension || response.db_vector_dimension == 0) {
      setConnectionStatus(true);
    } else {
      localStorage.setItem(
        'neo4j.connection',
        JSON.stringify({
          uri: userCredentials?.uri,
          user: userCredentials?.userName,
          password: btoa(userCredentials?.password as string),
          database: userCredentials?.database,
          userDbVectorIndex: response.db_vector_dimension,
          isReadOnlyUser: !response.write_access,
          isgdsActive: response.gds_status,
          isGCSActive: userCredentials?.isGCSActive,
        })
      );
      setConnectionStatus(false);
      resetConnection({
        openPopUp: true,
        chunksExistsWithDifferentDimension:
          response.db_vector_dimension != 0 && response.db_vector_dimension != response.application_dimension,
        vectorIndexMisMatch: true,
        uservectordimenstion: response.db_vector_dimension,
        chunksExists: true,
      });
    }
  }, []);

  return {
    checkVectorIndex,
  };
}
