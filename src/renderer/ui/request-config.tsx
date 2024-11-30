import './request-body.css';

import {
  Box,
  Tabs,
} from "@mantine/core";
import { useState } from "react";
import { Request } from "types/request"
import RequestAuth from "./request-auth";
import RequestBody from "./request-body";

interface RequestConfigProps {
  request: Request;
}

export default function RequestConfig({request}: RequestConfigProps) {
  const [selectedTab, setSelectedTab] = useState<string>('auth');

  return (
    <Tabs
      value={selectedTab}
      onChange={value => value === null ? null : setSelectedTab(value)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Tabs.List
        style={{
          flexGrow: 0,
        }}
      >
        <Tabs.Tab value="auth">Auth</Tabs.Tab>
        <Tabs.Tab value="headers">Headers</Tabs.Tab>
        <Tabs.Tab value="body">Body</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        key={`${request.name}_auth`}
        value="auth"
        style={{flexGrow: 1}}
      >
        <Box pt="md" style={{maxWidth: '500px'}}>
          <RequestAuth/>
        </Box>
      </Tabs.Panel>

      <Tabs.Panel
        key={`${request.name}_headers`}
        value="headers"
        style={{flexGrow: 1}}
      >
        <Box pt="md">
          Headers panel
        </Box>
      </Tabs.Panel>

      <Tabs.Panel
        key={`${request.name}_body`}
        value="body"
        style={{flexGrow: 1}}
      >
        <Box pt="md" h="100%">
          <RequestBody/>
        </Box>
      </Tabs.Panel>
    </Tabs>
  )
}
