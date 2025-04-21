import React from 'react'
import { History } from './history'
import { HistoryList } from './history-list'

const HistoryContainer: React.FC = async () => {
  return (
    <History>
      <HistoryList />
    </History>
  )
}

export default HistoryContainer